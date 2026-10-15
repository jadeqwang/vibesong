# HANDOFF: conventions for the Act II-V section teams

Read `README.md` (architecture) first. This file is the contract: follow it and four teams can work in parallel without touching core.

## 1. File layout and registering a scene

```
src/scenes/act2/<shot>.js     one module per scene/shot (helpers in sibling files are fine: act2/common.js, act2/art.js)
src/show/main.js              add your entries to YOUR act's array only
```

```js
// src/show/main.js  (inside show(T))
const act2 = [
  { id: 'act2.chorus1', t0: T.cue('act1.chorus_downbeat'), t1: T.section('Chorus 1').end,
    load: () => import('../scenes/act2/chorus1.js') },
  { id: 'act2.build', t0: T.section('Chorus 1 tag').start, t1: T.raw().timing.drops[0].impact_s,   // 80.81
    load: () => import('../scenes/act2/build.js'), transition: { type: 'stroke', dur: 0.25 } },
];
```

- Ranges are half-open `[t0, t1)` in song seconds. Derive them from `T` (sections, bars, cues), never from BPM math.
- If two entries overlap, the later-starting one is composited over the earlier one with its `transition`: `cut` (default), `stroke` (a ragged graphite brush wipe), or `iris`. Bible rule: never a plain crossfade between looks. Prefer transitions that happen inside a scene (a stroke draws it, or the camera performs it).
- Scene module contract:

```js
import * as T from '../../show/timing.js';
import { Stage2D, Z, ZUI } from '../../core/stage2d.js';
export async function setup(ctx) {         // ctx: { renderer, post, width, height, fps, T, lib, entry, show }
  const st = new Stage2D(ctx, { bg: PAL.void });
  // build everything here (async loads: Hanzi2D.create, fonts, sprites are preloaded in ctx.lib)
  return { stage: st, update(t) { /* PURE function of absolute song time t */ } };
}
```

- 3D scenes return `{ stage: { kind: '3d', fx }, update(t), render(t, target) }` and drive `ctx.post` themselves (see `scenes/dev/turn_show.js`, `scenes/turn_demo.js`, `scenes/talos_world.js applyLook`).
- Check your scene in isolation: `tools/stills.sh out/dev/act2 960x540 41.2 43.9 48.62`, or `node render.js --show main --from 41.03 --to 54 --res 960x540 --mp4 out/review/act2_wip.mp4 --audio`. Only scenes overlapping the range are set up.

## 2. Timing helpers (`src/show/timing.js`, imported as `T`)

| Helper | Use |
|---|---|
| `T.beat(i)` / `T.bar(n, b)` | measured beat grid. `T.bar(49)` is the drop-1 bar. Fractional beats interpolate (`T.beat(73.5)` is an 8th). |
| `T.beatAt(t)`, `T.barAt(t)` | inverse: `{ bar, beat }` |
| `T.beatsIn(a, b, sub)` | all grid times in a window (sub 2 = 8ths, 3 = triplets, 4 = 16ths) |
| `T.line(id \| text)`, `T.words(id)`, `T.word(id, i)` | lyric lines and word times (ids in `analysis/lyrics_timed.json`) |
| `T.accent(id)` | `vocal_accent` of a shouted chant. **Cut shouts here, not on the consonant onset.** |
| `T.section('Drop 1')`, `T.silences()`, `T.accents(a, b)` | structure |
| `T.cue('act1.stop1')` | measured micro-cues from `data/cues.json` (add an `act2` block for yours) |
| `T.snap(e)`, `T.on(t, e)`, `T.since(t, e)` | frame-snap discrete events, so a cue lands on the frame nearest to its time |
| `T.exactFrame(t, times)` | true on exactly one frame per event (1-frame flashes) |
| `T.pulse(t, times, decay)`, `T.beatPulse(t, sub, decay)` | decaying envelopes for punches |
| `T.span(t, a, b, ease)`, `T.keys(t, [[t,v],...])`, `T.ease.*` | interpolation |

Measure your own micro-cues before you trust a grid time. The accents after a stop land 50-80 ms after the grid times in `timing.json` (see README "Timing"). The method (5 ms RMS envelopes on the demucs stems) is in `data/cues.json` `_doc`. Stems: `work/demucs/htdemucs_ft/song/*.wav`.

## 3. Coordinates, z-order, camera (2D)

- World units are **game pixels**: 320x180 visible at zoom 1, y up, (0,0) bottom-left. Place things on integer coordinates (`Quad.place` snaps).
- `st.cam.set({ x, y, zoom, shake: [dx, dy] })`: x, y is the view centre. Zoom 1 = 320x180, zoom 2 = 160x90 with 2x pixels. Integer zooms are pixel-exact. Non-integer zooms are fine for moves.
- World layers (`Z`): `BG 0, BG2 5, PARALLAX 10, BACK 20, PLATFORM 30, PROP 40, ACTOR_BACK 45, ACTOR 50, ACTOR_FRONT 55, FRONT 60, FX 70, TEXT 80, HERO 90, TOP 99`. Within a layer, a higher z offset (`Z.ACTOR + 2`) draws on top. In composite groups, set `child.userData.dz = 0.5` before `st.add`.
- UI layers (`ZUI`, fixed 320x180 screen, drawn after the pixel post, never shakes or zooms): `BACK 0, HUD 10, BANNER 20, SUBS 30, DIALOG 40, TOP 50`.
- Multi-mesh objects inside one layer sort by creation order. Give inner parts a z position (`mesh.position.z = -0.5` draws first) if order matters (see `Hanzi2D` shadow).

## 4. Characters

```js
const jade = st.add(new Actor(ctx.lib, 'jade', { name: 'jade' }), Z.ACTOR);
jade.set({ x, y, anim: 'run', frame, t, facing: 1, pencil: true, flash: 0, sil: [0,0,0,1] });
```

- Strips are read live from `assets/sprites/sprites.json` (art-dept updates drop in). Animation names are in `core/sprites.js STRIPS`: jade `idle run jump victory back draw_graphite draw_rainbow sing drum run_pencil`, charlie `idle run jump shield parachute trampoline throw pull`, ricky `idle run jump chord sustain victory`, eraser `chase loom redeemed` (x2 density) and `chase1 loom1 redeemed1`.
- **Jade hair canon is enforced.** Pass `pencil: true` whenever a pencil is in her hand. Then `run` maps to `jade_run_hairdown`, and a hair-up strip with `pencil: true` (or a hair-down strip without it) throws. Once she takes the pencils out, keep `pencil: true` until she puts them back (hair up again).
- `x, y` is the feet contact point. `frame` overrides `t`. Use beat-locked cycles from choreo: `run(..., { cycle: 'beat', per: 8 })`.
- Choreography: `new Track(start).run(t0, t1, x).jump(t0, t1, x, y, { apex }).hold(...).path(...)`, then `actor.set(track.at(t))`. Land jumps on `T.snap(T.beat(n))`. A party of three can follow one track with delays (see `kaizo.js heroState`).
- 3D: `new Actor(lib, 'jade', { name: 'jade' }).voxel()` gives a Group with the same `set()`. The hair canon is shared.

## 5. Palettes, pencils, Hanzi

- Use `PAL` names (`core/palette.js`). Draft world: paper `#efe6d2`, graphite `#4a4a50 -> #9a9aa2` (bible). VOID: `PAL.void`, blueprint grid, `missingA/B`. Rainbow ramp: `PAL.rainbow[0..11]`, `rainbowAt(u)`.
- **Pencils (canon, bible "Look" row):** yellow bodies. The PINK/ORANGE cap pencil has a GRAPHITE core and draws gray (FIXTURES); the BLUE cap pencil has a RAINBOW core and draws colour (FUNCTIONS). Use `new Pencil({ kind: 'graphite' | 'rainbow', len })` (anchored at the tip, `set({ x, y, angle })`). In the bun the pencils cross in an X through the bun (art dept sprites).
- **Nothing appears except by a stroke.** Use `Hanzi2D.create(ch, { size, style, bold })`, then `h.plan(t0, t1, { strokes, gap })` (true stroke order, durations proportional to stroke length). Call `h.apply(t)` every frame. `h.tipAt(t)` is pure, for the pencil. `PencilRig` moves one pencil across several plans. Styles: `graphite`, `rainbow`, `ink`, `block`, `solid` (`u.uColor`). `h.flood(cx, cy, r)` floods graphite into rainbow (the FUNCTIONS touch). `h.eraseLeftOf(x)` rubs a stroke out (THE ERASER). Platforms: `h.strokeTopAt(i, x)`, `h.topAt(x, yBelow)`, `h.strokeBox(i)`.
- 3D strokes: the same data via `voxelizeHanzi` + `HanziVoxels` (`src/hanzi.js`), and the same plan timing can drive `setProgress`.

## 6. Text styles

| Style | How |
|---|---|
| Hero type (stamped, Lost Vikings logo) | `TextSprite({ text, font: 'px', charColor \| gradient, outline: PAL.ink, outline8: true, shadow })` in the UI layer at integer scale 3-4. Stamp scale frames `[1.35, 1.15, 1.04, 1]` from the word's snapped time, punch `[1.14, 1.05, 1]` on stabs (see `paint_run_ship.js`). |
| In-world block letters you stand on | `blockText(text, { font: 'px', cell: 3-4 })` gives a canvas, per-letter canvases (`letters[i].draw(colors)`) and `heightAt(x)` |
| Floor-tile lyrics | `kaizo_art.letterTile(ch, bloom, hue)` |
| Words that become platforms (VOID) | `kaizo_art.extrudedChar(ch)` (white face, blue extrusion), Quad x3 |
| Subtitles (every sung line, both directions) | ONE slot: `const sub = st.addUI(new Subtitle({ y }), ZUI.SUBS); sub.set(subtitleFor(t, lineId))`. The sung language is on top (fp12, karaoke-lit from word times) and the translation is below (fp10, `PAL.subBot`). The copy lives in `show/subtitles.js` only. Lines whose words are built into the world are marked `inWorld: true`, so only the translation shows. No subtitles for ad-libs or the Fixtures!/Functions! chants. Keep the slot off faces: Act I uses `y: 150` (top) over the floor lyric and `y: HUD_H + 3` in the VOID. |
| Dialogue (Lost Vikings banter) | `new DialogueBox(lib).set({ who, text, reveal, talking })`. Use `DialogueBox.revealFromWords(t, text, T.words(id))` for typewriter text synced to syllables. |
| Prompt box | `new PromptBox().set({ text: 'what do I need?', reveal, t })` (cursor blinks at 2 Hz, deterministic) |
| Speech bubble | `new Bubble().set({ text \| spans, x, y, reveal })` |
| Banner | `new Banner({ text, font: 'px', color }, { style: 'gold' \| 'dialog' \| 'paper' })` |
| PAPER / handwritten | `font: 'kai'` (LXGW WenKai, smooth). Call `await loadFonts(['kai'])` in setup. |
| TALOS 3D subtitles | `font: 'sans'` (Inter, smooth). Call `await loadFonts(['sans'])`. |

Rules: all text is in code, never in generated images. The names come from `show/cast.js` (the name gate may flip). Keep text off faces. Check legibility by downscaling frames to 480 px wide. Use fewer, bolder elements, and never overlap two texts (check the stamp frames too).

## 7. HUD and FX

- `const hud = st.addUI(new HUD(ctx.lib), ZUI.HUD); hud.set({ singing: { jade: bool }, alert: bool, alertOn })`. `HUD_H = 36`. "LINES OF CODE: 0" never moves.
- Flash: `st.fx.flash = T.exactFrame(t, times) ? 0.9 : 0` (white, over everything). `st.fx.fade` + `fadeColor` for fades.
- Freeze or stutter the scene clock: `fx.freeze(t, a, b)`, `fx.stutter(t, hits, { start, end })`, compose them yourself (see `kaizo.js tau`). Keep UI (subtitles, HUD) on real `t`.
- `shake(t, events, { amp, dur })` returns integer pixels for `cam.shake`.
- `Batch` + `Atlas` for anything numerous (particles, tiles, chain links). `dust`, `debris`, `sparkle` are pure in `t - t0`.
- Backgrounds: `PaperBG` (`u.uBlankX` erased line, `u.uMissing` checker creep), `BlueprintBG` (`u.uGlitch`), `SunburstBG`, `CheckerRect`.
- `clipX` / `clipR` uniforms on every PixelMaterial and Batch hide anything left or right of a world x (rubbed out, world edge).

## 8. The 2D <-> 3D switch

- Act III starts with THE TURN at 80.81 (drop-1 impact). Use `TurnRig` (`src/turn.js`) and `turnParams(u)`: a single parameter u in 0..1 drives the ortho->perspective dolly zoom, pixel block 6->1 (at 1080p), palette, outline, flat->PBR (`G.uFlat`), sun, shadows, tone mapping, bloom, DOF and grade. Map u to song time with the timing helpers, e.g. `u = T.span(t, 80.81, 82.3, T.ease.inOut)`.
- At u = 0 the 3D world must match the 2D slice. The TALOS strip (`world.js makeStrip`) is that slice. Build the last 2D shot of Act II so its framing equals the rig's `target2D` and `H2D = 180`. Either cut on the impact from your Stage2D scene to a 3D scene whose u=0 frame matches, or overlap them with `transition: { type: 'cut' }` on 80.81 exactly.
- Heroes in 3D: `Actor.voxel()` (same strips, same canon). Palette: `post.setPalette([...PALETTE, ...lib.colors(strips)])`.
- After a 2D scene the runner calls `post.set2D` each frame. 3D scenes set their own look every frame (`applyLook`), so nothing leaks between them.

## 9. Act I end state (handoff at 41.028, the chorus downbeat)

- Look: VOID. Black with the blueprint grid (minor 8 / major 32 px), wireframe cube gizmos, an axis gizmo top-right (UI), a few missing-texture squares. The HUD shows `LEVEL NOT FOUND` blinking at 4 Hz in the LINES OF CODE panel.
- Platforms: the 说出来 and 它就存在 rows (white blocks with blue extrusion), and the rainbow 未来 staircase (Hanzi2D size 96, rainbow, fully drawn by 39.97).
- Jade (hair DOWN, both pencils in hand) lands on 来's long horizontal (stroke 3) exactly on 41.028. Charlie (an 8th behind) and Ricky (a beat behind) are mid-hop on 未. The camera is tilted up and still rising (`kaizo.js` lines marked VOID camera).
- If Act II starts with a different framing, cut on 41.028 (chorus downbeat) or continue the climb on the held 来 (vocal to 41.6).

## 10. Performance tips

- 2D frames render in about 2 ms on the GPU. Throughput is bound by pixel readback (~45 ms/frame at 540p over CDP), so use `--workers 3` for long ranges (separate browsers on contiguous frame chunks).
- Build textures, canvases and Hanzi in `setup`, not in `update`. `TextSprite.set` only re-rasterises when its spec changes, so avoid per-frame-changing text where it isn't needed.
- Use one `Batch` per layer for many small sprites, not hundreds of Quads.
- Big Hanzi (size 256) voxelise in about 100 ms in setup. Cache data per character (`Hanzi2D` does).
- 3D frames with the full post chain cost 130-175 ms at 1080p (prototype numbers). Keep AO/DOF off when the shot doesn't need them.
- Keep frame dirs out of the repo. Review renders go to `out/review/`, scratch to `out/dev/`.

## 11. Team process (2026-10-14)

- Teams and ranges: A = Act I + Act II (0-77.76, engine owner), B = `src/scenes/act3/` (77.76-123.35), C = `src/scenes/act4/` (123.35-173.02), D = `src/scenes/act5/` (173.02-end).
- Core changes: append a request to `engine/CORE_REQUESTS.md`. Team A implements it and marks it DONE. Don't edit `src/core/` directly.
- `src/show/main.js`: edit only your own act array, with minimal diffs. Re-read the file before editing, because other teams edit it too.
- Seams: `engine/HANDOFF_77.md` documents the exact state at 77.76 (A -> B). B/C and C/D write the same kind of note for their seams (`HANDOFF_123.md`, `HANDOFF_173.md`).

## 12. LINES OF CODE running gag (2026-10-15)

The HUD counter counts up with strokes and drawn blocks, jumps on big draws, and drops when THE ERASER rubs things out. Use `hud.set({ loc: locAt(t) })` with `import { locAt } from '../../show/loc.js'`. Add your act's events in your block of `src/show/loc.js`.
