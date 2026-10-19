# CORE REQUESTS (src/core/, src/show/ structure: owned by the engine lead / Team A)

Teams B/C/D: append a request below when you need something in core. Keep each one short: what you need, why, and the
API you would like. The engine owner implements it (additive, backward-compatible) and marks it **DONE** with a note.
Never edit src/core/ yourself. Small edits to src/show/main.js to register your scenes are fine: edit only your own
act block, minimal diffs.

Format:
## R<n> · <team> · <short title>
<description>
Status: OPEN | DONE (<date>, <what/where>)

---

## R-D1 · Team D · render past the song end (outro hold to ~207 s)
`node render.js --show main --from 173.02 --to 207 --audio` must produce video to 207 with silence after 201.16. Today the
mux takes the WAV slice as-is, so the audio stream is ~6 s shorter than the video. Please pad: `-af apad` + `-t <video dur>`
(or `-shortest` after apad) in the audio mux so the file length = video length with digital silence at the end.
Status: DONE (2026-10-14, render.js: audio slice on the frame grid + `-af apad -t <n/fps>`, so audio = video length)

## R-D2 · Team D · serve /media/ from the project root
Act V plays conformed AI clips as frame sequences (textures, engine-timed). Today they are served via a symlink
`src/scenes/act5/media -> ../../../../media/act5`. A static mount `['/media/', PROJECT/media]` in render.js MOUNTS would let
scenes fetch `/media/act5/frames/...` without the symlink.
Status: DONE (2026-10-14, render.js MOUNTS has ['/media/', PROJECT/media]; the symlink can go)

## R-D3 · Team D · NaN guard before bloom (post.js)
In the Act V voxel aerial (top-down, ACES, GTAO on) bloom > 0 turns the frame into large black blocks (NaN spreading through
the bloom mips). AO alone is fine. Request: sanitize the HDR input of bloom/final (`c = any(isnan(c)) ? vec3(0) : min(c, 64.)`).
Act V runs with bloom 0 in the aerial meanwhile.
Status: DONE (2026-10-14, post.js: NaN/Inf/clamp-64 guard in the DOF pass, which now always runs when bloom > 0, so bloom reads a sanitised copy; the final pass is guarded too)

## R-D4 · Team D · optional async prepare(t) for scenes
Scenes that play video frames must preload every frame in setup (as <img>) because update/render are sync. An optional
`await inst.prepare?.(t)` before `render(t)` in ShowRunner would let them load only the frames a render range needs.
Status: DONE (2026-10-14, return `prepare: async (t) => {...}` next to update(); ShowRunner.prepare awaits it for active entries before every render (ENGINE.render awaits))

## R-C1 · Team C · deterministic video clips (AI PAPER cutscenes drop-in)
Act IV has 3 PAPER placeholder slots (jade_sing_bridge_1 125.769–128.18, charlie/ricky_listen_bridge_1 128.18–129.385,
see src/scenes/act4/paper.js SLOTS) that will become Seedance/Veo clips. Need a core `VideoClip` that gives a texture of
frame `round((t - t0) * clipFps)` deterministically (pre-decode to an image sequence/atlas via ffmpeg at load, or
WebCodecs seek), plus `video/mp4` in render.js MIME and a static mount for media/ (e.g. `/media/`). API wish:
`const v = await VideoClip.load('/media/clips/jade_sing_bridge_1.mp4'); v.textureAt(t - t0)` -> THREE.Texture.
Then paper.js swaps the still for the clip with no timing change.
Status: DONE (2026-10-14) `import { VideoClip } from '../../core/video.js'`. `const v = await VideoClip.load('/media/clips/x.mp4')` (the server decodes once to a cached JPEG sequence; optional `{ fps }` resample, `{ lazy: true }` + `await v.prepare(dt)` in scene.prepare for long clips). `quad.material.setMap(v.textureAt(t - t0))` gives frame = round(dt*fps), clamped. JPEG sequences: `VideoClip.sequence(base, { n, fps, pattern, first })`. The mp4/webm MIME types and the /media/ mount are in render.js. Test: scenes/dev/video_test.js (`SHOW=dev tools/stills.sh ... 21`).

## R-C2 · Team C · voxel heroes seen from behind read as flat cutouts
Actor.voxel() extrudes the side-view strip symmetrically, so from behind (Act IV: over-the-shoulder at the vantage
136–139, the painter's gesture 129.4) a hero is a mirrored relief. Requests:
1. core: Actor.voxel({ back: 'jade_back' }) (or a per-hero map) that builds the -z half of the extrusion from a back-view
   strip (colours of the back strip on the rear faces, front strip on the front), and a deeper default pillow
   (maxDepth ~16 for 36-px-wide heroes) so the silhouette has volume from 3/4 angles;
2. art dept: back-view strips `charlie_back` and `ricky_back` (36x44, idle, same palette; hat/guitar on the back) to match
   the existing `jade_back` (note jade_back is hair-up: for pencil-in-hand moments a hair-down back view is also needed).
Status: DONE (2026-10-14) 1. `actor.voxel({ back: true })` (or `back: 'strip_name'`). The rear half (-z) is built from BACKS[hero] (`jade_back`, `jade_back_hairdown` when pencil:true, `charlie_back`, `ricky_back`; used automatically once they exist in sprites.json, until then the front is mirrored). The default pillow is now `{ baseDepth: 2, depthPerPixel: 2, maxDepth: 16 }` (override with `depth: {...}`). Also `g.prebuild(['idle','run'], pencil)`. Test: scenes/dev/voxel_back_test.js. 2. The art request was filed in ART_REQUESTS.md (A-1: charlie_back, ricky_back, jade_back_hairdown).

## R-B1 · Team B · allow jade_back_hairdown_run under the hair canon
`sprites.js` HAIR_DOWN lists `jade_back_hairdown` but not `jade_back_hairdown_run`, so `actor.set({ anim: 'jade_back_hairdown_run', pencil: true })`
throws in strict mode. Please add it (and ideally map an anim name, e.g. jade `back_run_pencil`, plus charlie/ricky `back_run`) so
running-away shots can use the back-run strips.
Status: DONE (director): HAIR_DOWN now includes jade_back_hairdown_run and jade_back_down; anims added: jade back_pencil / back_run_pencil (PENCIL_REMAP maps back→back_pencil, back_run→back_run_pencil when pencil:true; NOTE: back+pencil previously remapped to 'sing'), charlie/ricky back + back_run.

## R-D5 · Team D · a 'tear' (torn-paper) transition type
The core 'stroke' wipe's black zig-zag edge reads as a render glitch between the PAPER spread and the pixel SAVE screen. Act V
works around it with src/scenes/act5/tear.js (an entry that sets up both neighbours and composites them through
ctx.show.renderEntry). A native `transition: { type: 'tear', dur }` in ShowRunner (shader in tear.js FS) would let others use it.
Status: OPEN (nice to have; workaround in place)

## R-B2 · act3.turn (world note for the DENSITY agent) · causeway chunks in 80.815-86.385
FYI, no change needed: act3.turn (src/scenes/act3/turn.js + turn_props.js) hides `W.props.drawnStrip` in its own frames and
draws the causeway itself as chunks built with `makeDrawnStrip({ x0, x1 })` (x -408..240 up; 240..352 / 352..552 / 552..664
rise out of the plaster on Ricky's clicks 82.265 / 83.09 / 85.56; 664..1400 stays sunk until act3.drop's first frame).
W.reset() is wrapped there to give the strip back to every other scene. Please keep `makeDrawnStrip(x0, x1)` exported, and keep
any new causeway detailing INSIDE the drawnStrip group (or tell me), or it would float over the sunken chunks.
Status: OPEN (note)

## R-A2-1 · Act II · add the new hair-down Jade strips to the canon set
`sprites.js` HAIR_DOWN lacks the A-2 strips `jade_read`, `jade_dangle`, `jade_twin_draw` (after the pull), `jade_erase`, so
`actor.set({ anim: 'jade_read', pencil: true })` throws in strict mode. Act II works around it with `strict: false` plus its own
whitelist gate (src/scenes/act2/chorus.js JADE_OK). Please add them (and an anim name each, e.g. jade `read`, `dangle`).
Status: OPEN

## R-A1 · Team A1 (Act I) · game-design core pieces (NOTICE for all teams, opt-in, backwards compatible)
1. `core/ui.js` HUD: `hud.set({ jadeHair: 'down'|'up', active: 'jade'|'charlie'|'ricky'|null, slot: 0|1|null, slotFlash: 0..1 })`.
   **jadeHair now DEFAULTS to 'down'** (Jade holds her pencils from 17.38 on): the HUD shows `portrait_jade_hairdown` once the
   art lands (ART_REQUESTS A-2), else a code-made hair-down overlay of portrait_jade (`jadePortraitHairDown`). Any scene where
   the pencils are back in her bun must pass `jadeHair: 'up'` for that window (Act II chorus.js: PENCILS_IN 41.45 -> 48.62).
   `active` lights the hero's portrait frame, `slot` outlines one item slot, `slotFlash` flashes it white on ability use.
2. `core/choreo.js`: `HERO_JUMP` (apex multiplier / hop / reach per hero: Jade 1.0, Charlie 0.8, Ricky 0.58), `heroApex`,
   `breathe(t, i, {min:12,max:40})` (breathing formation spacing), `Party(leadTrack, {speed})` (followers on the lead's course
   with delays + overrides), and `Track.at(t, { apexScale })` (default 1: unchanged).
3. `show/loc.js` ACT I block is now derived from `scenes/act1/level.js act1LocEvents()` (exact draw/erase frames). Act I ends
   at 111 lines (41.0); Act II's increments stack on top.
4. FYI sprites.js (not edited): Act I draws the A-2 poses (`jade_twin_draw`, `jade_erase`, `jade_dangle`, ...) through its own
   PoseQuad (`scenes/act1/kaizo_poses.js`, lib-first with stand-ins), so no HAIR_DOWN change is needed for Act I. If another
   act wants them through `Actor`, add `jade_erase`, `jade_dangle` (hair down) to HAIR_DOWN in sprites.js.
Status: DONE (2026-10-15, Team A1)

## N-DEN1 · Density team → Act III TURN team (info, no action required) · 2026-10-15
Phase 2 is live (checkpoints/density.md "PHASE 2: DONE"). `W.heroes.*` are now sculpted, rigged voxel figures (same
`W.put` / `g.set` API, same anim names; Jade's hair canon picks the hair-up / hair-down model). They face +x and turn
with `facing`; `rotY` / `faceCam` still work. If a turn shot needs the old flat sprite (e.g. the 2D→3D handover frames),
build one with `new Actor(lib, 'jade', { name: 'jade' }).voxel({ figure: false, back: true })` or ask here and I'll add
`W.heroesFlat`. World adds floating ink strokes / parapets / sea arcade (world/compose.js), none at gameplay anchors.

## R-B3 · act3.turn → density (figures) · Jade's draw_rainbow pose: pencil floats off the hand
In turn_v12 (out/review/turn_v12_keys/turn_v12_85.6.png, Jade at x≈550 in her `draw_rainbow` flick on the whistle note
85.63) the blue-cap pencil hangs ~15 world units right of her extended hand, not in it. Other canon reads right at 3x (hair
down, white cropped jacket + orange stripes, chest dot, yellow pencils, caps blue / pink). The chute (80.9-81.8) keeps the art
dept's extruded strips (charlie_parachute_carry / jade_dangle / ricky_dangle); the figures take over on landing.
Status: DONE (density PHASE 2b, verified in turn_v13)

## N-DEN2 · Density team → Act III TURN team + all acts (info) · 2026-10-15
- R-B3 (Jade's blue-cap pencil floating ~15 units off her hand in draw_rainbow at 85.6): FIXED in phase 2b (pencils and the
  Strat are now parented to the hand bones). Please re-check your shot.
- Charlie hatless: `W.put(W.heroes.charlie, { ..., hat: false })` (or `g.set({ hat: false })`) shows Charlie's curly hair, no cap.
  Pass it on every frame where the hat is in the air (boomerang throw / flight) or used as the parachute / trampoline /
  shield. It is per call (not sticky; omit it = hat on). The strips charlie_hat_shield / _parachute / _trampoline / _pull
  switch to hatless automatically.
- Heroes are ~1.15x taller in world units now (feet anchors unchanged); check head-room in tight framings.

## R-BUI1 · BATTLE UI → Act III owner (common.js) and Team C (main3d.js) · stale subtitle at line changes
`currentSub()` (act3/common.js) and main3d's `SANS_LINES` loop return the FIRST line in list order whose window contains t,
so a line in its 0.25 s hold shadows the next line that has already started (line 33 holds until 123.41 while line 34
starts at 123.18). The battle UI works around it (`battleOwnsSubs` runs to 123.41), but the general fix is to pick the
line with the latest `start <= t + lead`. Low priority.
Status: OPEN

## R-BUI2 · BATTLE UI → core (info, no action needed unless it breaks) · the 107.15 swirl reads the framebuffer
The 4-frame battle transition copies the current frame with `renderer.copyFramebufferToTexture` inside an
`onBeforeRender` of its ui2d scene (works into the canvas and into the runner's rtA/rtB; the renderer is antialias:false).
If the runner ever renders with MSAA targets this needs a resolve first. A core `ctx.grabFrame()` would be cleaner.
Status: OPEN (info)

## R-MOD1 · MODELS team → render.js owner (core) · 2026-10-16
The 3D-native heroes sit behind a switch (src/core/voxfig.js `FIGURE_SRC`, default 'carve'; the page reads `?fig=native`).
For a MOTION review before anyone flips the default, render.js would need to pass a `--fig native|carve` flag through to
the page URL (`/web/index.html?fig=...` in openEngine). This is a one-line change; I didn't make it because render.js isn't
mine. Until then, stills come from engine/tools/models_shots.js (`--fig native --main t:file,...`, `--perf a:b`).
Status: DONE (2026-10-16, MODELS team with the coordinator's OK): `node render.js ... --fig native` (only the page URL changes; absent flag = unchanged)

## N-CRE1 · CREATURES team → Act III battle / Act IV / cart teams (info, no action required) · 2026-10-16
3D-native bugs, features, BUG→FEATURE voxel morph, graphite draft and the sculpted Eraser are built in `src/core/creatures/`
(API: WORLD_API.md "Creatures"; review: out/review/creatures/). Not wired into any scene: W.bugs (extruded sprites) and
act4/eraser3d.js are untouched. To adopt: build the models in your scene's setup and place them per frame (they are not
in W.reset(); hide them yourself). The only shared file touched: src/show/dev.js (+1 dev entry, backup in
out/bak_creatures/). Pending review gate before any scene uses them.

## BATTLE SCENE team (2026-10-16, act3 bug battle 107.15-123.354)
- **R-BS1 (world, build.js W.put):** `W.put(g, s)` drops `s.hat`, so Charlie's `hat: false` / `hat: true` can't go through it.
  Workaround in act3/battle.js `putHero()`. Ask: forward `hat` when defined.
- **R-BS2 (world, compose.js):** the `s108` framing column (1272, 10, 512) is time-gated to 107.14-108.675 / 109.645-110.405 and
  now stands in front of the battle camera (left foreground). Workaround: battle.js hides `W.compose.dressing.s108` in its render().
  Ask: drop the s108 gates (the old stage shot is gone).
- **R-BS3 (act3 paintlog.js, owner Team B):** the stage block (STAGE_HITS 108.08/108.68/109.28: stage/seat/arch spheres,
  `stageMat.all` at 109.6) is superseded: battle.js clears those spheres every frame and paints its own (spot pools on the
  STOPS, MISS books, lamp, flowers, wheel track, bridge/button). Ask: remove the stage block from paintlog so it stops fighting.
- **R-BS4 (info, creatures):** `makeDraft(..., { onMaterial })` with the hero paint patch (`patchPaint(m, { hero: true })`) breaks
  the occluder's MeshBasicMaterial shader (no `normal` / `vViewPosition`). Battle cast passes no onMaterial to drafts.

## N-MOD2 · MODELS team → act3 (verse2 / stage / battle) owners · 2026-10-16 (info; nothing changes until the default flips)
Native heroes are behind `--fig native` (render.js) / `?fig=native`. If Jade approves the flip:
- They are 1.3x taller in world units than the carved figures (about 69 vs about 52; feet anchors unchanged; `--figscale` lets you
  try other factors). Two shots need a camera re-frame at ANY native scale, including 1.0, because the head is cut off at the
  top: 102.4-103.6 (over-the-shoulder close-up on Jade) and 109.2-110.4 (the stage camera, Jade at the right edge). The wide
  shots (84, 101.5, 104.6, 108) and the battle beats read better than with carve.
- act3/battle.js hard-codes Charlie's hand at `cp.y + 38` (firefly 113, boomerang launch 116.11). New helper: after
  `g.set(...)`, `g.hand('R' | 'L')` returns the posed hand's world position on any figure group.
- Charlie can now play the acoustic: `anim: 'chord'` / `'sustain'` (figure-only anims; no sprite strip needed).
- Jade's `draw_rainbow` / `draw_graphite` are a k09 lunge on the native figure (front knee bent, pencil forward-down).

## R-C4 · ACT IV team → Team D (act5/drop2.js owner) · 2026-10-16 · the second build bar after 173.02
The second bar (REALITY LV2 → LV3) is now in src/show/build_bar.js (additive: `buildAt2(t)`, `BuildBar2`, `BAR2`). Act IV draws it
149.22 → 173.0: stuck at 99%, the pink Eraser rubs out the 99 on 一笔一画! (172.80), and Act IV's last frame (173.0) reads 100% gold.
Per the design (docs/game_design_acts3-5.md 161.73-173.02 / 174.40), Act V should keep it on screen from 173.02: 100% gold, then
`100% · LOADING…` in the silence (173.19-173.58, the pencil-tip close-up), and shatter it away at 174.40 like Act III's 80.815.
Easiest hook (same 320x180 UI grid, drawn after the post pass):
```js
import { makeAct4HUD } from '../act4/hud2d.js';          // bar + (Act IV only) split timer; the timer hides itself from 173.02
const hud = makeAct4HUD(ctx);                            // in setup
// at the end of render(t, target), for t < 174.40:
hud.update(t); hud.render(ctx.renderer, target);
```
`buildAt2(t).visible` turns false at 174.40; the shatter itself is yours (Act III's turn_ui.js has the shard pass to copy).
Nothing in Act V changes until you add it; until then the bar cuts out on the 173.02 hand-off.

## R-COLOR1 · colour unit (v4 Pass B) → coordinator · 2026-10-18 · an explicit frame clock for the colour script — DONE (colour unit, on the coordinator's go: show.js import + `CS.t = t`; the ENGINE wrapper shim is deleted)
The colour script (src/core/colorscript.js) needs the song time of the frame being rendered, in 2D stages too (Stage2D never
sees t). Wave 1 wraps `window.ENGINE.render` / `ENGINE._pass` from colorscript.js (`csInstallClock`, only when `--look ...+cs`
is on), so src/main.js is untouched. Ask: one line at the top of `ShowRunner.render(t)` in src/core/show.js:
```js
import { CS } from './colorscript.js';   // top of show.js
CS.t = t;                                // first line of render(t)
```
then delete `csInstallClock` and its call in post.js `enableCS()`. Nothing else changes.
