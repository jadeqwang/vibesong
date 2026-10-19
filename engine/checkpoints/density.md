# Density team checkpoint (Reality Lv 2: world + hero voxel density, Acts III-V)

Owner files: src/scenes/act3/world/{build,props,paint}.js, src/world.js, src/voxel.js, src/materials.js, Actor.voxel() in src/core/sprites.js.
Backup of src/ before any edit: engine/out/bak_2026-10-15/.

## M0 (done)
- Read WORLD_API.md, teamB.md, concepts k07/k08b, current renders. Scene usages of world fields audited
  (turn.js/paintlog.js use W.avenue[k].position/.userData{h,base}/material lp; act4 world4.js patches + toggles every
  top-level scene child (baseObjs), so new world geometry must be top-level children added inside build()).
- BEFORE stills (1080p, untouched src) -> out/review/density/before/b_<t>.png (81.8 84 88 101.5 108 119.5 131 140 150 175).
  Render time for all 10 stills ~2 s after a 5.3 s init.
- Filed A-3 in ART_REQUESTS.md (2x `_hi` hero strips, spec + canon).

## Plan
1. voxel.js: face-culled voxel mesher with per-vertex AO (replaces one-InstancedMesh-of-cubes per frame).
2. Actor.voxel density 2: `<strip>_hi` when present, else Scale2x upscale; finer pillow (8-neighbour chamfer).
3. World: voxel cypresses (flame silhouettes), full entablatures + more temples, stairs/terraces, aqueduct, finer
   stratified cliffs/mesa sides, causeway detailing; gameplay landmarks untouched.

## M1 (done): engine + world density
- voxel.js: meshVoxelGrid (face-culled voxel mesher, baked per-vertex AO), distToEdge8, scale2x.
- sprites.js Actor.voxel: density (default 2 when scale >= 0.5), `<strip>_hi` strips when present (A-3), else Scale2x +
  de-outline fallback; one face-culled mesh per frame (was one InstancedMesh of cubes). Same Group API (set / prebuild).
- build.js: sun leak fix (applyLook re-asserts the shared world's sun; Act V's world wrote envUniforms.uSunDir directly so
  any Act III frame in a batch that set up Act V was lit by Act V's high sun). Voxel flame cypresses (avenue + clumps),
  fine stratified mesa sides (v=3, mesher), fine grass nap on mesa A (noAO), fine cliff segment (v=4) under the causeway.
- world.js: architecture kit (columnGeo, entablatureGeo, pedimentGeo2, roofGeo, stairGeo, ashlarGeo, bake/place);
  makeRuins rebuilt with it (same RNG order: column positions + the boomerang column unchanged), continuous entablatures,
  roofed temple front, ashlar crepidoma, great gate entablature; monument in ashlar with mouldings + Doric inner portal.
- NEW world/detail.js: 5 hill temples (peristyle, cella, pediments, tiled roofs, crepidoma + stair, terrace platforms),
  terraces, aqueduct over the sea (x 1620..3900, z 175, top below the causeway), 8 stratified sea stacks with ruins,
  ~110 voxel cypresses in rows, stepped voxel strata over all inland hills (grass tops). sunSafeH() keeps big meadow-side
  pieces out of the low sun's shadow on the causeway strip.
- World build ~10 s (once per worker; was ~1.6 s).

## M2 (done): mid-ground + review
- detail.js: stoa toward the monument (x 1660..2480, z -96), terrace wall behind the back row, ruined triumphal arch (1480,-270),
  scattered drums/stumps. Hill-strata material lift (rock/grass triplanar textures are albedo multipliers) -> green terraces post-flood.
- A-3 `_hi` strips were delivered by the art dept at 14:17 and are live. Canon audit: hair-down Jade `_hi` strips invented
  headphones -> HI_HOLD in sprites.js (fallback upscale) + review filed under A-3 in ART_REQUESTS.md; RARE EARTH missing on
  jade_back / jade_back_hi (filed).
- Review: out/review/density/density_beforeafter_sheet.jpg (+ pair_<t>.jpg, before/, after/), heroes_3x_sheet.jpg,
  acts3-5_sanity_sheet.jpg (77.8..207 every 2 s: no black frames / missing props). Turn sweep 80.8..86.4 clean.
- Perf 1080p: 216 ms/frame wall vs 201 before; init 11 s vs 2.2 s.
- WORLD_API.md updated (density layer, sun re-assert, hero density, perf).
## Open / honest gaps
- Mesa A grass nap still reads slightly gravelly at the 101.5 low camera; FlowerField stems (plaster) read as stakes.
- Far islands (5000+) are still smooth blobs; causeway has no parapets (camera-safety: low hero shots look across it).
- Jade pencil-in-hand poses still use the upscaled 36x44 art until the headphone-free `_hi` redraws land.
- 131/140/175 shots don't show the shared world (Act IV paper plane / Act V world5), so they're unchanged.

## PHASE 2: DONE (2026-10-15)
Backup of the phase-1 state: out/bak_density_p1/. Review: out/review/density/p2/
(density_p2_beforeafter_sheet.jpg = phase 1 vs phase 2 at the 10 times; heroes_vs_k08b_sheet.jpg; acts3-5_sanity_p2.jpg
77.8..207 every 2 s, clean).
- HEROES: src/core/voxfig.js. Sculpted voxel figures carved from the A-4 turnarounds (assets/sprites/turn/, art dept schema
  with parts boxes; built-in canvas stand-ins if missing): visual hull front ∩ side ∩ back, per-slice superellipse rounding,
  arms split at the art's arm boxes, per-FACE colour from the facing view (voxel.js meshVoxelGrid faceCol), de-outlined views,
  10 parts (head, torso, upper/lower arms, thighs/shins) under pivots + carved items (strat, flat cap, pencils; the acoustic
  and Jade's bun pencils come carved from the views). Procedural poses for every Actor anim (idle run jump victory sing draw_*
  drum throw shield parachute trampoline pull chord sustain dance hang read back/back_run). Actor.voxel() returns a figure
  for jade/charlie/ricky by default (same set()/prebuild() API, hair canon picks jade_up / jade_down, facing -1 turns
  around, back anims turn the back to camera); voxel({ figure: false }) = the extruded sprite fallback. Bugs stay extruded.
  Dev turntable: show dev, t 40..70 (scenes/dev/figure_test.js).
- WORLD: src/scenes/act3/world/compose.js. Floating ink strokes (丿 丶 ㇏ 一, voxel stone slabs with dry-brush tails, a
  broken-off tail + debris), placed by solving for screen spots in the logged cameras of 81.8 / 101.5 / 108 with their
  sun-shadow footprints off the causeway/mesas; ruined sea arcade under the causeway's sea edge; ashlar parapets on the
  causeway shown only in WIDE shots (camera y > 110 or |z| > 350); stratified voxel far islands with temples + cypress
  groves (old blobs hidden; noAO: GTAO drew a horizon band from the 5-12k geometry); per-shot framing pieces gated to
  measured shot ranges (88: sea columns, 101.5: stump + drum, 108: column + entablature). Flower heads (props.js
  FlowerField) are thin 5-petal blossoms on thin stems instead of box crosses (the "gravel" at 101.5).
- Shot ranges measured from cameras (30 fps log): 87.845-89.945 (88.0), 101.01-102.245 (101.5), 107.14-108.675 + 109.645-110.405 (stage).
- Perf 1080p: ~242 ms/frame wall (render 5-18 ms GPU), init ~12-17 s once per worker.
- Gaps: figures are posed procedurally (no hand-keyed animation; run/draw read, chord/sustain are approximate);
  in side-on cameras the figures read smaller than the old flat sprites; strokes are monochrome stone, no glow.

## PHASE 2b: DONE (2026-10-15)
Backup of phase 2: out/bak_density_p2/. Review: out/review/density/p2b/ (density_p2b_beforeafter_sheet.jpg = phase 2 vs 2b;
heroes_vs_k08b_p2b_sheet.jpg; acts3-5_sanity_p2b.jpg 77.8..207 clean). All in src/core/voxfig.js (+ sprites.js voxelFigure).
1. 3/4 faces: one view per voxel by its angle in the slice (hard seams); the side view's profile eye is removed (small blobs
   enclosed by skin in the front view's eye rows -> skin), so a 3/4 head never shows front + profile eyes; dark interior
   outline pixels below the neck lose to the adjacent view's lit pixel (the black speckles on jeans / Strat / jacket).
2. Bulk: model unit 0.56 -> 0.64 (1.15x world height; feet anchors unchanged), each slice section grown at carve time
   (head 1.1/1.08, body 1.2/1.07, limbs 1.18/1.18), colours from the nearest opaque pixel. (Mesh scaling was tried and dropped.)
3. Items in the hands: arm pivots from the carved voxels (shoulder/elbow centroids, measured arm column so hair / the carried
   guitar never join an arm); hand = bottom of the forearm mesh; pencils gripped near the tip (blue cap right / pink cap
   left restored each frame; draw_graphite swaps them). R-B3 (85.6 pencil 15 units off the hand) verified fixed.
   jade_down = jade_up body + hair-down head/hair (the hair-down art's part boxes were distorted by the hair).
   Strat on a strap at the belly; both hands placed on it by 2-bone IK (fret hand on the neck, pick hand at the strings).
4. chord: strumming pick hand + fretting hand on the neck, head down; sustain: lean back 13 deg, neck raised, knee bent;
   Ricky idles with his hands on the Strat.
(b) Charlie hatless: set({ hat: false }) -> model carved from the turnarounds with the cap pixels turned into curly hair and the
   brim cut; auto-hatless (hat undefined) for hat_shield / hat_parachute / hat_trampoline / hat_pull. Per call, not sticky.
- Perf 1080p ~213 ms/frame wall. Dev turntable: show dev t 40..76 (Jade close-up 66-68.5, Charlie hat/hatless 68.5-70, Ricky 70-72).
- Gaps: Charlie's 3/4 face is still busier than k08b (his art has heavy hair strands across the cheeks); the left (fret) hand
  is mostly hidden behind the neck from the usual cameras; no hand-keyed animation.

## PHASE 2c: DONE (2026-10-15)
Backup of 2b: out/bak_density_p2b/. Review: out/review/density/p2c/ (heroes_vs_k08b_p2c_sheet.jpg = k08b | p2 | p2b | p2c at
84 / 101.5 / 104.6 / 108; density_p2c_beforeafter_sheet.jpg = 2b vs 2c; front_portraits_p2c.png; acts3-5_sanity_p2c.jpg clean).
All in src/core/voxfig.js flatViews():
1. Flat materials: per hero one palette over front/side/back (greedy by frequency; a colour joins the nearest entry of the same
   chroma and similar value, so painted shading collapses onto the base tone; region seeds sampled from the art's part boxes
   (skin, cap/hair, torso, legs, sleeve, back, shoes) never merge, which keeps Charlie's beige cap apart from his skin).
   Thin interior outlines (dark runs <= 2 px between lit material) take the local material; 3D mode filter per part absorbs
   isolated off-colour voxels (<= 1 same-colour neighbour, >= 5 of another). Items (Strat, cap, pencils) flattened the same way.
   The p2b "dark pixel loses to the other view" guard was removed (it was what turned Jade's black crop top / jacket front into
   a patchwork).
2. Faces: front and side views are cleaned inside the face span (eye rows to chin): every non-skin blob that is not an
   explicit feature becomes skin; features = marks with skin on both sides within 4 px (eyes, brows, mouth). On the head the
   front view owns the whole front half (cone 0.2), the side view the sides; the side view's profile eye stays removed.
   jade_down uses jade_up's part boxes (its own boxes made the skin seed sample hair).
3. Canon verified on the front portraits + turntable: white jacket with orange stripes, black crop top, small pale-blue chest
   dot, 1420 MHz patch, back = big dot + RARE EARTH, yellow pencils with one blue and one pink cap.
- Gaps: the stage / co-op cameras see the heroes mostly in profile or from behind, where Charlie's side-view curls still cover
  most of his head side; Jade's long hair (pencil poses) reads as a large black mass from 3/4.
