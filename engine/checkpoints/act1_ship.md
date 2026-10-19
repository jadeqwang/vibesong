# ACT I ship checkpoint (game-design pass, docs/game_design_acts1-3.md) — started 2026-10-15

Range 0–41.028. Deliver: out/review/act1_v4.mp4 (+_sheet.jpg), out/review/act1_v4_keys/ (A1–A9 @1080p).

## Plan / status
- [x] core/choreo.js: per-hero jump apex (HERO_JUMP), breathe() spacing, Party follower helper, Track.at(t, {apexScale}) (opt-in, b/c)
- [x] core/ui.js HUD: active-hero highlight + item slot flash (hud.set({active, slot})), jadeHair 'down' default
      (portrait_jade_hairdown when in sprites.json else code-made overlay), kaizo passes jadeHair:'up' before 17.44
- [x] show/loc.js ACT I block derived from scenes/act1/level.js events (+1 per stroke/block at the frame drawn, -1 on graphite erase)
- [x] paint_run_ship: PAINT -> RUN (chord clicks ▶, 画 runs) -> SHIP (hat swallows 画, 画 cartridge clacks in)
- [x] char_select: class tags SHIP/RUN/PAINT + demos per spec
- [x] level card LEVEL 1-1 · DRAFT + PASSWORD: 一笔一画 (press_start dive -> kaizo)
- [x] kaizo.js rewrite (14.01–41.028) per spec beats
- [x] HANDOFF_41.md accurate
- [x] renders + keys

## Notes
- Eraser vs LOC rule: drops only while it rubs graphite 16.73–27.8; after Jade colours, it can't erase colour, and it LEAPS the
  draw-ahead pit (never touches her graphite platforms), landing on the last ledge at 34.30, skids, peers.

## Milestone (2026-10-15, mid-day): all scenes rewritten, stills reviewed across 13.8-41.03
- New files: src/scenes/act1/level.js (timing/layout/Eraser rub line/LOC events, pure), src/scenes/act1/kaizo_poses.js
  (A-2 pose names with stand-ins), kaizo.js rewritten (old one: out/bak_2026-10-15/kaizo_v3_pre_rewrite.js).
- Debug: set globalThis.KAIZO_DEBUG = [] in the page to log per-frame positions.
- Next: render out/review/act1_v4.mp4 + sheet + 1080p keys; review; HANDOFF_41 screen positions.

## DELIVERED (2026-10-15): out/review/act1_v4.mp4 (+audio), act1_v4_sheet.jpg, act1_v4_keys/ (A1..A9 + A2b @1080p)
- Known gaps: A-2 art still stand-ins; Jade's 0.46 s PAINT demo is very fast (cursor hop timing); party can bunch in huddles;
  Act II chorus.js had a syntax error mid-edit by the Act II team at delivery time (not ours; Act I renders fine).
- Next if resumed: drop in A-2 strips when they land (no code change), re-check canon crops; polish door-erase readability.

## v5 DELIVERED (coordinator notes): out/review/act1_v5.mp4, act1_v5_sheet.jpg, act1_v5_keys/
- Real A-2 strips in use (free-hand / boots / smear skid_offset / baked '?' read from sprites.json meta). Freeze chain: Jade
  mirrored so the chain marches down-right; door push-in zoom 1.5 33.0-33.58; shield gaps 27; rub line = body front (eOff 52);
  char-select PAINT preroll (pre = hop - 0.14); LEVEL NOT FOUND banner dropped (HUD only, per spec).
