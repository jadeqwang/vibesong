# Creatures team checkpoint: bugs, features, morph, Eraser (3D-native voxel models)

## STATUS (read first) · updated 2026-10-16, end of round 2
- Round 1: gate PASSED. Round 2 (the coordinator's 6 polish items): ALL DONE, sheets rendered, WORLD_API updated.
- In progress: nothing. No renders or agents running.
- NEXT STEP: wait for the coordinator's review of the *_r2 sheets in out/review/creatures/. If notes come back, re-render
  with the two commands in "R2 DONE" below (about 1 min), then rebuild the sheets with --r2.
- The battle scene team consumes src/core/creatures/ (API in WORLD_API.md "Creatures" + "round 2 additions"): changes must stay additive.
- Open gaps after r2: the upright ladybug and beetle show a large dark belly from the front (anatomical: the shell sits on
  the back); the glider is still smaller-faced than m3's in a wide shot; the bridge is a railed plank bridge, not m3's
  flat beam; the morph's arc heights use rest-pose distances (fine visually).


Owner files (new only): src/core/creatures/*.js, src/scenes/dev/creatures_test.js, one entry in src/show/dev.js,
WORLD_API.md "Creatures" section (append), out/review/creatures/.
Design: docs/game_design_acts3-5.md (bug roster, battle system, density), docs/decisions.md (2026-10-15 late).

## M0 (done, 2026-10-15)
- RESUME §0 smoke test OK: RTX 3090 / 550.163.01, Chrome 153.0.8010.36, 2 stills in 14.7 s (out/dev/smoke_a.png, smoke_b.png look right).
- Read WORLD_API.md, voxel.js meshVoxelGrid, W.bugs (extruded sprites via Actor), rap.js (BUGS / FEATURE_T), act4/eraser3d.js
  (makeEraser().set({ pink, face, blink, scrub, lean, squash, wave }), H = 1.6 units), refs k09 / k11 / m1-m3 / bugs + eraser sheets.

## Plan
1. vox.js: SDF primitives + per-part voxelizer (priority claim), per-part meshVoxelGrid meshes in a joint hierarchy, voxel list.
2. bugs.js (5 bugs, idle / dance / bug behaviour), features.js (5 features, count-matched by scale search + interior trim).
3. morph.js: CPU InstancedMesh morph (stroke-order pairing, arc, spin, ease, stagger, colour lerp, glow), graphite draft.
4. eraser.js: sculpted block, LODs, gray/pink via 2 colour attributes, face slab per expression, cap, sleeve.
5. dev scene + review sheets + perf.

## M1-M5 (done, 2026-10-16): built, reviewed, sheets out. STOPPED AT THE REVIEW GATE.
Files: src/core/creatures/{index,vox,bugs,features,feature_anims,morph,eraser}.js, src/scenes/dev/creatures_test.js,
src/show/dev.js (+1 entry 'dev.creatures' t 1000..1400; backup out/bak_creatures/dev.js.orig), tools/creatures_render.py,
tools/creatures_sheets.py, WORLD_API.md "Creatures" + CORE_REQUESTS.md N-CRE1 (backups in out/bak_creatures/).
Voxel counts (bug = feature, exact): ladybug/button 13938 · beetle/wheel 14276 · moth/glider 6854 · caterpillar/bridge 4682
· firefly/lamp 4486. Lengths: ladybug 46, beetle 53, moth 43, caterpillar 52, firefly 41 voxels. Feature size is found by a
k-search; overshoot is trimmed from cells >= 4 deep from the exterior air (never visible).
Perf (1080p, shared world): 230 ms/frame bare, 248 with 10 creatures, 230 with 5 morphs, 233 with the hi Eraser.
Review: out/review/creatures/{bugs_vs_k09_sheet, features_sheet, morph_strip_<bug> x5, eraser_sheet, bugs_anim_sheet,
drafts_sheet, turntables_sheet, lineup_sheet}.jpg. Rebuild: python3 tools/creatures_render.py <dir> 1920x1080 'k09_*' ...
then .venv/bin/python tools/creatures_sheets.py <hi> <lo> out/review/creatures.
Lessons: the stage disc top is y=16 (raycast, not MESA_B.top); GTAO renders its own pass and needs userData.noAO on
depth-only helpers; low-frequency wear on big flat voxel faces terraces into contour lines (keep wear on edges).

## ROUND 2 (polish, started 2026-10-16): gate PASSED; battle scene team is consuming the API -> ADDITIVE changes only
Coordinator's list (priority order), status [ ] todo / [x] done:
1. [ ] UPRIGHT stance for all 5 bugs: `stance: 'upright'` (makeBug opt default + per-set() override). Stand on hind legs,
   front legs = arms; dance + bug loops work upright; faces read front-on to a 3/4 high battle camera.
   Plan: per-bug STANCE {Q = rear-bottom pivot (voxels), theta, hipY}: body rotates theta about Q, Q placed at (0, hipY);
   hind legs (index 2) re-hipped to Q and counter-rotated; head counter-rotated ~0.85 theta; caterpillar = front segments
   curve up (no legs). Firefly = pitched hover.
2. [ ] BEETLE glossier: lower roughness, fresnel rim on 'metal', lighter top facets (per-face colour via part.topCol ->
   meshVoxelGrid faceCol), bigger readable face.
3. [ ] MOTH bigger fluffier body + front face; GLIDER bigger moth face + longer, wider wings (m3).
4. [ ] LAMP eyes 25% smaller (eyes(..., { scale })).
5. [ ] MORPH from the CURRENT pose: mo.set({ u, from: state | liveBugGroup }) samples per-voxel joint transforms;
   wheel: tyre/hub on a 'spin' joint, eyes + mouth on the non-spinning head (face doesn't spin).
6. [ ] Firefly draft stray black block: verify at 1080p.
Deliverables: *_r2 sheets + upright_sheet_r2.jpg; WORLD_API "Creatures" additions; this checkpoint.
R2 progress (2026-10-16): [x]1 upright (src/core/creatures/stance.js, applied after the anim in index.js assemble)
[x]2 beetle gloss (metal rim + faceK top facets + bigger face) [x]3 moth bigger / glider moth-head + long V wings
[x]4 lamp eyes x0.75 [x]5 morph samples live poses (from: state | Group), draft rebuilt on a hidden posable rig,
wheel 'spin' joint + separate mouth part [x]6 firefly draft block: gone (was GTAO on the occluder, fixed in r1).
New dev shots: up_*, updance_*, upbug_*, lineup_upright, morphpose_*, wheelroll_*, draftup_*, draftupp_ladybug_*.
NEXT: final renders -> *_r2 sheets + upright_sheet_r2 (tools/creatures_sheets.py --r2), WORLD_API update, report.
R2 DONE (2026-10-16). Sheets: out/review/creatures/{bugs_vs_k09_sheet_r2, features_sheet_r2, morph_strip_<bug>_r2 (from the
upright dance pose), eraser_sheet_r2, upright_sheet_r2}.jpg. Rebuild: tools/creatures_render.py HI 1920x1080 'k09_*' 'm3_*'
'eraser_*' 'up_*' 'updance_*' 'upbug_*' 'wheelroll_*' 'draftup_*' 'lineup_upright' 'morphpose_*' ; LO 1280x720 'feat_*' ;
.venv/bin/python tools/creatures_sheets.py HI LO out/review/creatures --r2. WORLD_API "Creatures round 2 additions" written.
Review-shot note: idle t=0.4 lands on the moth's blink (seed 3); the dev shots use t=1.0.
STOPPED for review after round 2.
