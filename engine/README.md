# vibesong engine · 一笔一画

A deterministic Three.js renderer for the music video, driven by an explicit song time `t` and rendered in headless Chrome on the GPU (RTX 3090, ANGLE/Vulkan). Every frame is a pure function of `t`: frames can be rendered in any order, in parallel, and come out identical. Nothing reads the wall clock.

The show is a list of **scene modules**, each owning a `[t0, t1)` range on the song timeline. Section teams add scenes in their own files under `src/scenes/<act>/` and register them in `src/show/main.js`. They don't need to touch the core. **Read `HANDOFF_ACTS.md` before writing a scene.**

## Quick start

```bash
npm install
# review pass of any range of the whole show, with the matching song slice muxed in (AAC)
node render.js --show main --from 0 --to 41.03 --fps 30 --res 960x540 --mp4 out/review/act1_v1.mp4 --audio
# contact sheet, one frame per beat (bar.beat labels), no video
node render.js --show main --from 0 --to 41.03 --res 960x540 --sheet out/review/act1_sheet.jpg --sheet-only
# stills at exact times
node render.js --show main --res 960x540 --stills 0.343:a.png,2.63:b.png
tools/stills.sh out/dev/x 960x540 14.2 16.9 23.8      # stills + a labelled 3-column sheet (out/dev/x/sheet.png)
# master
node render.js --show main --from 0 --to 201.16 --res 1920x1080 --mp4 out/master.mp4 --audio --workers 3
# live preview in a browser
node render.js --serve     # http://localhost:8123/web/?show=main&t=23.8&w=960&h=540   (&live=1 plays from t)
# legacy single scenes from the prototype (still work)
node render.js --scene turn_demo --from 0 --to 6 --mp4 out/turn_demo.mp4
```

Options: `--res WxH` (or `--width/--height`), `--fps` (30), `--crf` (16), `--preset` (medium), `--workers N` (splits the range across N browsers, then concats; safe because frames are pure functions of t), `--gpu vulkan|gl|swiftshader`, `--out dir` (also write PNG frames; normally no frames touch the disk).

**Speed** (RTX 3090, 960x540): see the numbers at the bottom of this file. Frames are read back as raw RGBA and piped straight into ffmpeg (x264), so no PNG frames are written to disk. Audio comes from a one-time WAV decode of the song (`out/cache/song.wav`) whose sample 0 is the analysis time base, so the muxed slice stays sample-accurate.

## Architecture

```
render.js                 CLI: static server, puppeteer, raw-frame pipe -> ffmpeg, audio slice mux, stills, contact sheet, workers
web/index.html            import map -> src/main.js
src/main.js               window.ENGINE: init({show|scene, width, height, fps, from, to}), render(t), readPixels(), capture(), sheet*
src/show/
  timing.js               ALL song timing: beat(i), bar(n,b), beatAt(t), word(), line(), accent(), section(), cue(), snap/on/since,
                          exactFrame (1-frame flashes), pulse/beatPulse, keys/span/ease
  index.js                show registry (main, dev)
  main.js                 THE SHOW: list of { id, t0, t1, load, transition? } per act
  subtitles.js            single source of subtitle copy (bilingual, both directions; CHANT_ZH locked)
  cast.js                 single source of names / bios / items (name gate may flip later)
src/core/
  show.js                 ShowRunner: loads only scenes overlapping the render range, renders 2D stages (world -> pixel post ->
                          UI overlay), 3D/custom scenes, transitions (cut / stroke wipe / iris) and the global flash overlay
  stage2d.js              Stage2D (320x180 game-pixel world + crisp UI layer), PixelCamera (snap, zoom, shake), Z / ZUI layer orders
  gfx.js                  PixelMaterial (tint, flash, silhouette, clipX/clipR rub-out, dissolve), Quad, canvasTex, pixelCanvas
  sprites.js              SpriteLib (live assets/sprites + sprites.json), Actor (strip anims, feet anchors, facing, JADE HAIR CANON),
                          Actor.voxel() for 3D
  choreo.js               Track: run / jump (lands on a beat) / fall / hold / path; beat-locked run cycles; smoothFollow
  hanzi2d.js              Hanzi2D: Make Me a Hanzi strokes as pixel platforms, true stroke order, plan()/apply()/tipAt(),
                          graphite / rainbow / ink / block / solid styles, colour flood, erase, topAt / strokeTopAt
  text.js                 fonts (Press Start 2P, Silkscreen, Fusion Pixel 8/10/12, LXGW WenKai, Inter), pixel-exact raster,
                          TextSprite (typewriter reveal, karaoke spans, outline/shadow/gradient), blockText (letters you stand on)
  ui.js                   HUD (Lost Vikings bar), Subtitle (bilingual slot) + subtitleFor(t, lineId), DialogueBox, PromptBox,
                          Bubble, Banner
  fx.js                   freeze / stutter time warps, shake, Atlas + Batch (instanced sprites), dust / debris / sparkle,
                          PaperBG (dither grain, erased-paper line, missing-texture creep), BlueprintBG, SunburstBG, CheckerRect
  props.js                procedural pixel props: canon pencils (graphite core + pink cap / rainbow core + blue cap), cartridge,
                          console, ▶ switch, flowers, panels, bubbles, "!" bang, checker, item icons
  palette.js              named colours (paper/graphite ramp per bible, pencils, rainbow, UI, void)
src/scenes/
  act1/                   ACT I (0:00-0:41.03): cold_open, paint_run_ship, char_select, press_start, kaizo (+ common, kaizo_art)
  dev/                    systems.js (every core system on one screen), turn_show.js (the 3D turn inside the runner)
  turn_demo.js, talos*.js prototype 3D TALOS world + THE TURN (TurnRig in src/turn.js, post chain in src/post.js)
src/post.js               HDR -> GTAO -> god rays -> atmosphere -> DOF -> bloom -> final (tone, grade, PIXELATE, outline, palette LUT).
                          2D stages take a fast path (no AO/atmos/DOF/bloom); render(scene, camera, target) can target an RT.
data/cues.json            measured micro-cues that refine timing.json (see "Timing" below)
assets/fonts/             OFL fonts + licenses
```

### The two looks the core supports

- **2D (CARTRIDGE / VOID / title cards):** `Stage2D`. World units are game pixels on a 320x180 grid (1 unit = 3 px at 540p, 6 px at 1080p). The final post pass pixelates with block size `outH / (180 / zoom)`, so sprites, Hanzi, block letters and particles all share one pixel grid. The camera snaps its bottom-left to whole pixels. The UI layer (HUD, subtitles, dialogue) renders after the post pass on a fixed 320x180 grid, so it doesn't shake, zoom or get re-pixelated.
- **3D (TALOS / the turn):** the prototype's world (`talos_world.js`), `TurnRig` (`turn.js`, one parameter u drives ortho->perspective dolly, pixel 6->1, palette, flat->PBR, light and post), and the full post chain. `scenes/dev/turn_show.js` shows the pattern for running a 3D scene inside the show. Heroes in 3D are `Actor.voxel()` built from the same live strips, with the same hair canon.

### Timing (never a fixed BPM)

Everything keys to measured times. `timing.js` loads `analysis/timing.json` (488-beat variable-tempo grid, 140->152 BPM), `analysis/lyrics_timed.json` (lines, word times, `vocal_accent` for chants) and `data/cues.json`. Event times are snapped to the render frame grid (`T.snap`), so a cue lands on the frame nearest to its timestamp (within half a frame).

`data/cues.json` holds measured micro-cues for Act I: the four intro whistle notes (0.91 / 1.35 / 1.78 / 2.63, from an FFT pitch track of the vocal stem), the chant stabs, the stutter hits, and the post-stop accents. Note that the accents that follow instrumental stops land **50-80 ms after** the grid times listed in `timing.json` `accent_hits` (for example 35.564 -> 35.64, 36.407 -> 36.49, 29.658 -> 29.72, 17.38 -> 17.44), and the cues file uses the measured transients. Measure your own act's micro-cues the same way and add them under a new key (the method is described in the file's `_doc`).

### Determinism rules

- `update(t)` must be a pure function of `t`. Use the seeded `mulberry32` / hash noise, and don't use `Math.random` (it's seeded anyway in main.js), `Date` or `performance.now`.
- Simulations: write them as closed-form functions of `t - t0` (see `fx.js` dust/debris), or replay a fixed-step simulation from a section start inside `update`.
- Caching (text rasters, voxel frames, LUTs) is fine because it's keyed by inputs.

## Known limitations

- The UI layer isn't palette-quantised and isn't affected by shake (by design). Hero type that should shake belongs in the world layer.
- Non-integer camera zoom (pull-backs, dives) produces slightly uneven pixel blocks at 540p. At 1080p, zooms of 1.5 and 2 are exact.
- `Actor.voxel()` builds frames lazily. Prebuild them (call `set` once per frame at setup) if a material patch has to see every frame before the first render.
- GTAO in 3D renders its own normal pass, so partially drawn strokes still occlude (inherited from the prototype).

## Measured speed (RTX 3090, 2026-10-14)

| Pass | Result |
|---|---|
| Act I, 960x540, 1231 frames, 1 worker | 62.8 s (19.6 fps). GPU render is ~2 ms/frame; ~47 ms/frame is raw readback + transfer |
| Act I, 960x540, `--workers 3` | 25.6 s (48 fps), including scene setup (~1 s) and the AAC mux |
| Scene setup | cold open 0.3 s, kaizo (verse + void) 0.8 s |

1080p is roughly 4x the readback cost, so use `--workers 3-4` for masters.
