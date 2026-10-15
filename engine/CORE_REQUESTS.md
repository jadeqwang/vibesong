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
