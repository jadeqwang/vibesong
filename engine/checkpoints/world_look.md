# world_look (round 4): the k08b world pass for the second half (86.385-207.2)

Owner files: src/scenes/act3/world/* (build, props, paint, detail, compose, NEW k08b.js), src/world.js, src/voxel.js,
src/materials.js, src/env.js, src/look.js, src/post.js. Backups of the round-4 start state: out/bak_r4/world_look/src/.
Scratch (renders, A/B trees, scripts): out/dev/world_look/ (delete when done). Review: out/review/world_look/.

## Flag and gating
- Everything is behind `--look k08b` (the existing flag). Without it no new shader string, uniform, geometry or RNG draw
  happens: **default renders are byte-identical**. Verified with a clean A/B (same tree with my files reverted vs mine,
  default flags, `cmp` on 1080p stills 86.8 / 104.6 / 119.8: IDENTICAL). Note: comparing against stills from an hour ago
  is NOT valid; models_r6 / talos_r4 change heroes and shots continuously. Use out/dev/world_look/ab.sh or snap.sh.
- With the flag, the world look is switched on only for song time t >= 86.385 (`H2_T0` in env.js; read from
  envUniforms.uTime, which every 3D scene sets). The 3D turn 77.76-86.385 renders as before even with the flag
  (shader branches on a uniform, voxel ground hidden, sun/IBL restored).
- Act V (t >= 173.02) keeps its own world (world5) sky and light; only the post grade / lens apply there.

## What the pass does (milestone 1 state)
1. **Light** (k08b.js post(), look.js TOD): time-of-day table keyed to the script: golden hour 86.385-123.18, blend to
   dusk 123.18-124.9 (the Eraser rises), dusk to 139.70, afterglow at the 139.70 slam (colour pours back), sunset in the
   rebuilt world 151-173. Each preset sets sky colours, sun colour/gain, sun ELEVATION (scene azimuth kept: golden 13 deg,
   dusk 3.5 = Act IV's own, afterglow 5.5, sunset 7.5), cool hemisphere fill + warm bounce, env (IBL) gain, rim colour,
   fog. PCSS soft sun shadows (penumbra grows with blocker distance: long soft shadows) on every patched material.
   Sun-side rim on heroes/bugs (fresnel x sun side, warm; cool sky rim on the other side). Volumetric light in post:
   height fog thickest over the sea + sun shafts ray-marched through the world's sun shadow map (40 steps, jittered).
   Anamorphic streaks on HDR > 3.2 (beams). Exposure x1.0-1.22 per preset.
2. **Sky** (env.js `skyGLSL()` k08b variant): purple zenith -> magenta -> orange band at the horizon under the sun,
   soft stretched evening clouds lit peach / lavender in shade. The IBL is regenerated when the time of day moves.
   Sea: paler lavender-teal body, sun glitter clamped (the fog carries the glow).
3. **Materials** (paint.js `K8_PAINT_GLSL`, `applyPaintK8`): per-kind model by plaster tag (stone, rock, meadow, clay,
   mesa pavers, roof, ink, generic). BEFORE colour = warm sandstone/paper-plaster with per-block tone variation (world-space
   ashlar cells 34-48 x 14, staggered; slabs on tops), faint joints, chipped edges, weathering. AFTER colour = richer
   sandstone, terracotta plinth/base courses near the ground, teal tile slabs on top faces (pavers / low tops), moss in
   the joints, mossy rock tops, voxel grain (0.3 units) on everything near the camera. The paint machinery (flood,
   hand-colouring, hatching edge) is unchanged, it now blends k08b-plaster <-> k08b-full.
4. **Ground** (k08b.js): voxel grass tufts + voxel flowers at the heroes' density (0.3-unit voxels = RES 2.5): the
   causeway (drawn level, always coloured; its top also gets the voxel grain), mesa A (replaces the old 3-blade tufts),
   mesa B joints + rim (stage floor kept clean), the meadow by the colonnade, coarse far layers. Chunked InstancedMeshes
   shown by camera distance. **Colour makes the grass grow**: uncoloured meadow is plaster stubble (12-20 % height), each
   tuft grows to full height where colour arrives (flood, Jade's hand-coloured path: the old tufts' local paint is
   mirrored every frame, the colour map); meadow flowers open only where coloured.
5. **Lens**: vignette 0.30, grain 0.03, bloom >= 0.38, streaks; DOF lifted on story beats (89.95-91.085 FUNCTIONS!,
   101.0-107.13 co-op, 123.18-125.6 Eraser rise, 143.48-149.2 colouring the Eraser), using each scene's own focus.
6. **Landmarks**: no gameplay coordinate, prop position or shot changed. Only the sun elevation changes (azimuth kept);
   shadows get shorter in Act III (13 deg vs 7.5), never longer, so the density unit's sun-safe placements still hold.
   Sun leak: the world's effective sun = scene sun -> TOD elevation; applyLook re-asserts it every frame (same mechanism
   as density's fix), and the PMREM key includes the TOD so a batch that renders Act V or the turn first can't leak.

## API (for talos_r4 / the wave unit / anyone)
- Props pick up the look automatically if their material goes through `patchPaint` (or `patchTree`): the kind comes from
  `userData.plaster` (Team B PLASTER tags) or `userData.k8kind` / `patchPaint(m, { k8kind })`:
  1 stone, 2 rock, 3 meadow/grass, 4 clay, 5 paver, 6 roof, 7 ink, 8 generic, 9 noPaint + voxel grain (always coloured).
- **Colour amount per region (hook for the k09 wave):** `W.colorMap` (only with --look k08b; `undefined` otherwise).
  `W.colorMap.fill((x, z) => 0..1).on(true)` each frame (pure function of t) -> a 256x256 top-down map over
  x -600..3800, z -1400..1200 (`W.colorMap.box`), max'ed with the flood sphere in BOTH the surface shader (plaster ->
  colour with the same hatched pencil edge as the flood) and the grass growth. `clear()`, `on(false)`. Direct: `.data`
  (RGBA8, r channel) + `.tex.needsUpdate = true`. Values between 0 and 1 show the hatching (the wave front).
- Shared uniforms: `K8M` (paint.js: palette, rim, PCSS), `K8U` (env.js: sky), `TOD` / `todAt(t)` (look.js).

## Review (milestone 1, 1080p, before and after rendered from ONE frozen tree, out/dev/world_look/snap)
- out/review/world_look/m1_sheet.jpg (default | k08b at 86.8, 90.4, 104.6, 119.8), m1_pair_<t>.jpg,
  m1_before_<t>_1080p.jpg / m1_after_<t>_1080p.jpg, m1_density_crop_2x.jpg (2x nearest crops next to heroes:
  117.9 stage floor; 86.8 the causeway grass at hero density).
- Note: 86.8 and 90.4 are talos_r4's new shots (they change while they work).

## Cost
- 1080p, 112-113 (stage, 30 frames, 1 worker, shared GPU): GPU render 26.7 -> 43.8 ms/frame (+17 ms), wall 344 -> 361
  ms/frame (+5 %; readback dominates). World build unchanged (~14.5 s; the scatter adds < 1 s).

## Honest state / open problems (milestone 1)
- It is warmer, unified and has the sky / sea / haze of k08b, but it is NOT yet k08b: k08b is high-key, luminous cream-gold
  with bright sunlit tops and crisp lavender shadows; ours still reads somewhat muted and pink-brown at mid distance
  (IBL + fog + split tone). Needs another grading pass toward cream/gold and less pink.
- Masonry is world-space, not per geometry block: joints don't follow the actual block edges; on large flat props
  (talos_r4's walls) it reads a bit like brick; on columns it gives drum lines (fine) plus occasional vertical joints.
- Chipped edges are shader chips along the world-space joints, not geometry; real chipped voxel edges not done.
- The plaster meadow stubble on mesa A still reads a little like carpet from low cameras.
- (see milestone 2 below for Acts IV-V)

## Milestone 2 (Acts IV-V + clip): DONE
- Grade nudge after m1: golden sun gain 1.15, creamier fog / horizon-away colour, softer split tone (Act III).
- Stills 1080p, default | k08b from one frozen tree: out/review/world_look/m2_acts4-5_sheet.jpg (124.6 Eraser rise at dusk,
  131.5 erased page, 139.8 the 画 slam, 150.5 rebuilt world, 166.5 出发 cart, 175.5 Act V aerial), m2_after_<t>_1080p.jpg,
  m2_tod_strip.jpg (golden 112.4 / dusk 124.6 / sunset 150.5).
- Clip: out/review/world_look/m2_clip_113-123_k08b_mb8.mp4 (540p, audio, `--look k08b --mblur 8 --shutter 0.33`, the
  battle into the 119.02 flood: plaster -> colour, grass growing in) + m2_clip_tile.jpg (1 fps).
- Cost, 540p, 116-117, mblur 8 / shutter 0.33, 1 worker: GPU render 111 -> 154 ms/frame (+38 %), wall 238 -> 259 ms (+9 %).
  1080p no blur (m1): 26.7 -> 43.8 ms GPU, 344 -> 361 ms wall. The 10 s clip took 64 s on 2 workers.
- Default inertness re-verified after all edits: A/B cmp at 90.4 / 117.9 / 124.6 (1080p, review flags): ALL IDENTICAL.
- Honest: Act IV dusk reads as dusk (purple sky, warm sandstone, terracotta bases) but darker and muddier than the default
  at 124.6, and the purple is saturated (k08-like, maybe too electric). After 141 (rebuilt world, cart) the change is mostly
  sky + haze; the Act IV erased page (131.5) and the 画 slam (139.8) barely change (their look is Act IV's own paper / glyph
  shaders, not mine). Act V is grade-only by design (world5 owns its sky/light; I left its photoreal aerial alone).

## Open problems (honest, end of this run)
1. Not yet k08b-level: needs a dedicated grading pass toward high-key cream/gold; shadows on near floors still go lavender
   -pink. The best shots are the stage ones (112-118), closest to k08; the Talos room is a moving target (talos_r4 is
   restaging it, cameras changed three times during this run), so I could not tune its compositions.
2. Masonry is world-space (joints don't follow real block edges); chips are shader-only; no geometry chipping.
3. Plaster stubble on mesa A can read as carpet from low cameras; the stage disc and seats are smooth (no fine detail).
4. Volumetric shafts only exist inside the sun's shadow frustum (shadowExtent around the target); there are no big
   off-screen "sunbeam" shafts like k08b's upper-left one (that would need an art-directed beam per shot).
5. TOD transitions (123.18-124.9, 139.7-140.4, 149.2-151) regenerate the PMREM every frame (~5-10 ms each).
6. Sun elevation in Act III went 7.5 -> 13 deg (k08b): shadows are shorter. If talos_r4 framed shadows for 7.5 deg,
   tell me and I'll make Act III's elevation a per-range table.
7. The k09 wave unit: use `W.colorMap` (above). The global flood sphere still works and is max'ed with it.

## Tools (out/dev/world_look/)
ab.sh (A/B inertness trees), snap.sh + rss.sh (freeze the tree, render before/after from it), rs.sh (stills + sheet),
sheet.py (labelled grids). All scratch renders deleted.

## Milestone 3: coordinator's grading must-fixes: DONE (pending review)
Review: out/review/world_look/m3_pair_<t>.jpg (default | k08b m3 | keyframe, full frames at the same width: k08b for
86.8 / 90.4 / 104.6, k09 for 119.8, k08 as the closest for 124.6 / 150.5 (no dusk keyframe exists), none for 166.5),
m3_sheet.jpg, m3_after_<t>_1080p.jpg. All from one frozen tree (snap.sh); default byte-identity re-verified (A/B cmp at
86.8 / 104.6 / 124.6: ALL IDENTICAL).
1. Sea: clear blue-teal near the camera with the original wave normals and sun glitter (k08b-only body + glitter mix by
   distance 500..3500), fading to the pale lavender haze far out. Height fog / sea mist now starts with distance
   (none below ~250 units, full beyond ~1500), so near water and near ground stay clear.
2. High key: exposure x1.45 (golden), warmer cream-gold sun, light cool-blue shadows (blue hemisphere fill, IBL gain ~0.42
   so the lilac sky doesn't tint shadows pink), cool split-tone fill, lifted cool blacks in the final pass (k08b only),
   saturation x1.13. Luma percentiles (1/5/25/50/75/95, UI band excluded): k08b keyframe 21/55/94/137/173/201;
   ours 90.4 27/68/110/138/173/231, 104.6 25/50/107/143/164/207, 119.8 16/28/120/156/184/225, 150.5 6/28/117/149/177/221.
   86.8 is darker (median 85) because the frame is mostly the requested blue water; 124.6 dusk median 88 (intended).
3. Skies: dusty lilac -> peach -> pale gold in every preset; dusk (124.6+) deeper but soft, the Eraser silhouette reads;
   the sunset/cart sky (166.5) is soft lilac, no royal/magenta.
4. Causeway grass: Team A's greens shifted to a warm yellow-green with 3- and 9-unit clump patches and dry patches; bigger
   tufts (9x16 voxels), 5,200 overhanging edge clumps (11x24) on both rims, 5,000 bigger flowers.
5. Sunbeam: an art-directed additive cone (soft core, streaked, depth-tested) from the upper left, landing just behind/left
   of the shot's target, 89.95-91.085 and 101.0-107.13. Placed from camera + target, so it follows restaged cameras.
6. Sun elevation per range: k08b.js `SUN_ELEV` (86.385-94.204 11 deg, 94.204-107.15 12, 107.15-123.18 13) + per-frame
   override from any scene's look: `LOOK({ k8SunElev, k8SunAz })`. Coordination note appended to checkpoints/talos_r4.md.
Honest: Act III now sits on k08b's histogram and palette; the remaining gap is composition (talos_r4's cameras) and the
sky only shows in shots that frame it. Saturation is still a bit under the keyframe (0.30-0.38 vs 0.39). 124.6 dusk
foreground is darker and muddier than the default. Act IV's erased page / glyph frames and Act V are unchanged by design.
Cost: not re-timed; the changes are one cone mesh + bigger strip tufts replacing ~14k smaller ones (expect within noise).

## REQUESTS
- (none yet)
