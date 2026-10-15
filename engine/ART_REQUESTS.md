
## A-1 · Team A (engine) for Team C · back-view strips for voxel heroes (R-C2) — DONE (art dept, 2026-10-14)
Engine support is live: `Actor.voxel({ back: true })` builds the rear half of each 3D hero from a back-view strip, mirrored
about the feet anchor. Please add to assets/sprites + sprites.json, 36x44, anchor [18, 43], same palettes, 1-2 frame idle:
- `charlie_back`: Charlie seen from behind: flat cap, curly hair at the nape, charcoal tee, the ACOUSTIC GUITAR on his back (strap diagonal), jeans, brown boots.
- `ricky_back`: Ricky from behind: short black hair, blue/white vertical-striped shirt (sleeves rolled), Strat body visible at one hip (strap over the shoulder), jeans, white sneakers.
- `jade_back_hairdown`: like the existing `jade_back` (big pale-blue dot + RARE EARTH under it), but with hair LONG and DOWN over the shoulders (pencil-in-hand moments). The pencils are in her hands (maybe a yellow pencil tip visible at each side), NOT in the bun.
The names must match exactly (engine map `BACKS` in src/core/sprites.js). No code change is needed when they land.
**DONE:** `assets/sprites/charlie_back.png`, `ricky_back.png`, `jade_back_hairdown.png` (2-frame idle, 36x44, anchor [18,43], palettes locked to each hero's strips), plus 4-frame `*_run` back strips (`charlie_back_run`, `ricky_back_run`, `jade_back_hairdown_run`). `jade_back_down` is an alias of `jade_back_hairdown` in sprites.json. Source: `assets/sheets/raw/backs_t1.png`; build: `tools/sprites/backs_cfg.py`. Known weakness: Jade's hand-held pencils read as dark nubs at the hips, not clearly yellow.
