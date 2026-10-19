# COLOR_REQUESTS: per-scene hooks for the colour script (v4 Pass B, unit "color")

The colour script (src/core/colorscript.js) grades the whole show by song time: graphite + paper before the flood (119.02),
the flood = the one full-spectrum break, the bridge drains to dusk (123.354 -> 125.769), the 画 slam (139.395) brings colour
back for good (the grade is off from there: frames as authored). It is opt-in until approved: `--look k08b+cs`.

**How a scene exempts something (keeps its colour before 1:59):**
- **2D (Stage2D scenes):** `obj.userData.cs = 1` (0..1; children inherit; 0 forces graphite on an auto-exempt thing).
  Automatic already: hero Actors (jade / charlie / ricky), Pencil props, rainbow Hanzi2D (style 'rainbow' or an active
  `flood`), any PixelMaterial with `rainbow > 0`, and the subtitle layer (ZUI.SUBS). A `Batch` is one object, so a batch is
  all-or-nothing: put the coloured instances in their own batch and tag that.
- **3D (post.render scenes):** write alpha 0.5 into the scene target (what `patchPaint(m, { hero: true })` does under
  --r5 + k08b), or make the thing an HDR emissive above luminance 2.0 (beams already are). For a material that must not take
  the hero light layer, the alpha line alone is enough: `gl_FragColor.a = 0.5;` after `#include <opaque_fragment>`.
- **A whole scene that must keep its own colour** (paper inserts / cards rendered through post): `scene.userData.csSkip = true`.
  Scenes that render with `renderer.render` directly (paper.js, spread.js) are never graded.

Scheduled by the coordinator after each owner's M2. Line numbers are as of 2026-10-18 16:40.

**Status (2026-10-18, coordinator):** H1-H7 and H16 DONE by the colour unit (it now owns those lines; see checkpoints/passB_color.md).
H8 SKIPPED (still 02 bypasses post and Jade approved it in colour). H9-H13 -> stage_3d, H14 -> paper, H15 -> type, handed over by the
coordinator after their M2. H4 as built: graphite until Ricky's click (22.98), then blue / visited purple (the colour is the gag).
H5 as built: tags only (the rainbow chunk tiles + her paint sparks / launch trail / paint tip); the plain ground stays graphite;
the 'settle back within a bar' idea was not built (it would need new timing).

| # | owner | file:line | hook | why |
|---|---|---|---|---|
| H1 (DONE) | open_close (kaizo is act1; coordinator to assign) | src/scenes/act1/kaizo.js:90 | `flBatch.userData.cs = 1;` | flBatch holds ONLY the colour things (the flowers that survive the Eraser + the 每一天 都是色彩 colour caps, drawn at :570-571, :575). One line restores the "colour is hard to erase" beat (16.73-31) - the best earned colour in Act I. |
| H2 (DONE) | same | src/scenes/act1/kaizo.js:460 | `eraserQ.userData.cs = 1;` | the rainbow smudge she rubs onto the Eraser (kaizo_poses.js:17, 29.08-31) is baked into its frames; the Eraser itself is grey, so exempting the whole sprite only keeps the smudge. |
| H3 (DONE) | same | src/scenes/act1/kaizo.js:91-93 | draw the rainbow-pencil sparkles (`fxBatch` / `hiFx` solid rainbow `px` draws) into a separate small batch tagged `cs = 1` | the pencil-tip sparks are "colour at the tip"; today they share a batch with grey crumbs. |
| H4 (DONE) | same | src/scenes/act1/kaizo.js:92 (`linkBatch`) | `linkBatch.userData.cs = 1` IF the "linked" chain (20.1-27) is drawn by Jade's rainbow pencil; leave grey if it is Ricky's / a world prop | it reads as a drawn stroke in v3; paper still #03 shows a blue link-chain at 0:20. Owner's call. |
| H5 (DONE) | type / coordinator (chorus.js is Team A's; type owns cut snaps only) | src/scenes/act2/chorus.js:93-95, :571 | put the `kind === 'rainbow'` chunk tiles (`cblk*`) and Jade's paint sparks (:581-595) into a tagged batch; keep the plain ground / grass grey | the FUNCTIONS flood (57.42) is THE stroke of Act II. Today the whole ground turns green-brown and stays (58-81): that spends the flood early. Proposal: the colour stays on what she touched (the rainbow chunks + a short green band under her path) and the rest of the ground settles back to graphite within one bar. |
| H6 (DONE) | same | src/scenes/act2/chorus.js:135 (`fnQ`) | `q.userData.cs = 1` on the FUNCTIONS letters | the rainbow FUNCTIONS word is the function stroke itself (FIXTURES stays graphite). |
| H7 (DONE) | same | src/scenes/act2/chorus.js:179 (`chant`) | `userData.cs = 1` on the 出 发 chant characters (i >= 5) | they echo the rainbow 出发 (the one preview); 一切从这里 stays white. |
| H8 (SKIPPED) | open_close | src/scenes/act1/char_select.js (the new CONTINUE beat, 7.18) | either `userData.cs = 1` on the SAVE FILE board, or accept graphite | approved still 02 is a full-colour pixel UI (navy brick, gold frames). The rule says UI chrome goes graphite; it is Jade's call which wins. Default here: graphite board, colour Jade sprite. |
| H9 | stage_3d | src/scenes/act3/turn.js (the 3D 出发 and the shatter, 77.76-86.385) | alpha-0.5 (or emissive > 2.0) on the 3D 出发 strokes | wave 1 protects them by chroma (protSat 0.8 in 72.17-86.385), which also keeps any other strongly saturated prop in the turn. An explicit tag is exact. |
| H10 | stage_3d | src/scenes/act3/verse2*.js (the rainbow stroke bridge ~107) and every pencil-drawn 3D stroke before 119 | alpha 0.5 on the stroke materials (and on the pencil prop in her hand) | "colour only at the pencil tip and on what she just drew": the bridge she draws should be the one coloured thing in the plaster world. |
| H11 | stage_3d | the FUNCTIONS slab carving (still 10, 89.9 and 183.1) | the rainbow carving as an emissive (> 2.0) or alpha 0.5 | target 10 is a FUNCTIONS stroke lighting up in rainbow: exempt. The FIXTURES slab (09) stays graphite. |
| H12 | stage_3d | the 1:47 stage spotlights, pools and light shafts (still 08, 107.15-110.41) | exact tag: alpha 0.5 on the pool / cone materials that use NormalBlending; for ADDITIVE cones and shafts (alpha can't carry the mask) either keep the cone core above HDR luminance 2.0 or name the meshes so a later colour wave can mask them | wave 1 keeps them with a timed chroma protect (protSat 0.42 in 107.15-110.41, colorscript.js) + the hero mask (the light's colour on the heroes stays). Checked on the live stage 107.8 / 108.4 / 109.0: rose on Charlie and teal on Ricky survive, the pale pools read the same. The HDR protect alone does NOT catch them: the existing cones are additive at opacity 0.16 and the pools are basic materials at 0.5, far under 2.0. The chroma window also keeps any other saturated prop in those 3.3 s. |
| H13 | stage_3d | src/show/battle_ui.js (`drawV4`: BUG -> FEATURE stamps 113.28-119.0, `> let's dance`) | draw the stamps in graphite / white before 119.02 (they render after post, so the grade cannot reach them) | UI chrome goes graphite; the cyan/yellow stamps are the last coloured UI before the flood. |
| H14 | paper | src/scenes/paper_inserts.js (new) | if it renders through `post.render`, set `scene.userData.csSkip = true` | paper close-ups 03-06 are full-colour paper inserts (approved); the grade must not reach them. |
| H15 | type | the new overlay modules (绽 ~94, 舞台 107.6-109.3, the couplet 123.18, 答 125.769-128.18) | before 119.02: ink / graphite type (no rainbow fills); from the bridge: dusk-neutral; overlays render after post, so they must pick their own colours | otherwise the type re-spends the colour the world is saving. The couplet's paper half can stay paper. |
| H16 (DONE) | coordinator (core) | see CORE_REQUESTS R-COLOR1 | an explicit frame clock | wave 1 wraps `ENGINE.render` / `_pass` from colorscript.js to learn the frame time. |

Not hooks, notes for owners:
- Heroes keep canon colours everywhere (default). The 3D mask already covers heroes and bugs (paint.js hero alpha).
- Look changes on a drop or a stroke: v3 already lands paper -> VOID on the 说出来 tear (34.6), VOID -> plaster on the 80.815
  shatter, plaster -> real on the 119.02 flood, real -> paper on the outro's rainbow-pencil wipe (186.65). The colour grade only
  changes on 119.02 / 123.354 / 139.395 (stroke / drop / stroke).
