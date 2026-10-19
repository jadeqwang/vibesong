# LOOK spike: motion blur + AA (sub-frame accumulation), k08b look preset

Status: DONE (spike) 2026-10-16 ~09:30. Both features are opt-in. With the flags absent, renders are byte-identical
(verified with `cmp` on stills at 20.0 / 117.5 / 166.5 after every install).

Files touched (originals in out/bak_look/*.orig): `src/post.js`, `src/main.js`, `render.js` (another agent added `--figres` to
render.js at 09:06 on top of my flags; both kept). New: `src/look.js`. Not touched: `src/core/show.js`, heromodels, motion.

## 1. Motion blur + AA: `--mblur N`

```
--mblur N            N sub-frames per frame (off unless N >= 2)
--shutter 0.5        fraction of a frame the shutter is open (180 deg = 0.5)
--shutter-phase open (default) | center
--jitter 1           sub-pixel camera jitter scale (Halton 2,3; 1 = +-0.5 px box)
--mblur-cut 10 --mblur-turn 5    cut-guard floors (world units / degrees), see below
--mblur-log 1        per-frame stats (used / cuts / skipped sub-frames)
```

How it works:
- `ENGINE.render(t)` (main.js `_renderMB`) runs the whole show N times at sub-times. `Post.render` (post.js `_renderAccum`) keeps
  one float32 accumulation slot per `post.render` call in the frame (transitions and montage callbacks get their own slots). Each
  sub-frame runs the full HDR chain (scene, GTAO, rays, atmosphere, look, DOF, bloom) with a jittered projection, and the result
  is summed into the slot. A last pass at exactly t divides the sum by the count and runs the normal final pass (tone map, grade,
  pixelate, outline, palette, vignette, grain). Everything the scene draws after `post.render` (HUD, subtitles, battle UI,
  ui2d) and the runner's flash and fade overlays render once at t. They stay crisp and are never jittered.
- Not accumulated: orthographic cameras (all 2D pixel stages, the flat part of the turn) and plain `renderer.render` scenes
  (paper.js, spread, ...). If the probe at t finds no perspective call, the frame renders exactly as with the flag off
  (byte-identical; checked at 20.0). Jitter is off when `uPix > 1` (block-pixelated 3D), but blur still applies there.
- **The shutter opens at t** (`t + i/N*shutter/fps`), not centred. The brief's centred formula would cut every `on()`,
  `pulse()` and `since()` cue to 50% on its own frame and blend the previous frame's state in. With the shutter opening at t and
  shutter <= 0.5, all sub-times stay within +0.5 frame, so every cue snapped to the frame grid (`T.snap` / `on` / `exactFrame`,
  which uses round) lands on the same frame at full strength. Stepped animation on a half-frame grid can't straddle a sub-frame
  either. Cost: the image is centred about 1/4 frame (8 ms) late, which you can't see. `--shutter-phase center` exists for comparison.
- Cut guard: (a) a sub-frame whose set of active show entries differs from t's is dropped. (b) An in-scene cut is detected
  when the camera at a sub-time is farther from the camera at t than 4 x |offset| x its own speed + 10 units (or the same with
  angle + 5 deg), or when the camera object changes. Speed is probed at t +- one sub-step (cheap: updates only, no scene render).
  A scan of 86.4-207 at N=8 caught 10 in-scene cuts that fall inside a shutter (91.1, 95.833, 97.067, 97.867, 103.767, 133.1,
  136.2, 143.4, 152.167, 165.867) plus 5 entry-boundary frames. It had no false positives on the drop-2 dolly (up to 117 u per
  half frame), the cart chase or the whip pans at 88.6. List: out/review/look/cut_guard_scan.txt.
- Randomness keyed by t: pure functions of t still work. Hash noise on continuous t (sparkle flicker) averages over the
  shutter, which is what real blur does. Noise keyed by `Math.round(t*fps)` stays constant within a frame. `Math.floor(t*k)` steps
  only straddle when a step boundary falls inside [t, t+0.5 frame).

Timing (RTX 3090, 1 worker, other agents idle; "render" = update + GPU, "wall" includes the raw readback, which dominates):

| | N=0 | N=4 | N=8 | N=16 |
|---|---|---|---|---|
| 540p battle 116.9-118.7, render ms/frame | 9.7 | 22.1 | 36.1 | 56.6 |
| 540p battle, wall ms/frame | 68 | 97 | 112 | 147 |
| 540p cart 165.8-167.5, render / wall | 7.6 / 64 | 16.7 / 89 | 28.6 / 102 | 44.3 / 136 |
| 1080p Talos 104-105, render / wall | 5.9 / 215 | 15.5 / 255 | 26.7 / 263 | 46.8 / 326 |

Edge crawl (1080p, 480x270 crop of the 104 colonnade, mean abs frame-to-frame luma diff): N=0 5.58, N=4 4.08, N=8 3.83,
N=16 3.75 (p99 75 -> 51). Some of the drop is blur, not just AA.

Evidence (out/review/look/): `battle_116.9_compare.mp4` and `cart_165.8_compare.mp4` (stacked OFF / N=8 / N=16, 960x540, audio);
the individual `*_off|mb4|mb8|mb16.mp4` clips; `aa_crop_1080p_t104.5_2x.png` (2x crops OFF / 8 / 16);
`aa_crawl_1080p_104_off_vs_mb8_2x.mp4`; `timing_540p.log` and `timing_1080p.log`.

Gotchas:
- Fast moves at N=8 still show 8 discrete ghosts (the battle dodge at 117.5, the 104.5 creature). Use N=16 for fast action.
- Each sub-frame calls `update(ti)` and then `update(t)` again, so time runs forward and back within a frame. Pure scenes are
  fine. A scene that caches a forward-only simulation ("replay from section start if t < last") would replay every frame.
- The outline pass, when on, re-renders the scene once at t to get depth (crisp outline over blurred colour).
- 2D frames still pay one extra `update` + UI render per frame for the probe.

**Recommended 1080p master:** `--mblur 8 --shutter 0.5` (open phase, the default), plus `--workers 3`. N=16 only if the fast
battle and cart shots still ghost. At 1080p the readback, not the sub-frames, is the cost: about 263 ms/frame per worker, so
the full 6,035 frames take about 26 min on 1 worker, roughly 9-10 min with 3 workers.

## 2. Look preset: `--look k08b` (src/look.js)

One HDR pass inside `Post._chain` (after atmosphere, before DOF and bloom), perspective cameras only, plus nudges to the scene's
post params (rays >= 0.45, bloom >= 0.5, vignette 0.28, grain 0.035, sat x1.06, contrast x1.04, grade 1), restored after each
call. It contains:
- warm sandstone: low-saturation surfaces re-tinted to a luminance-normalised sandstone colour. The sea is excluded and gets a
  pink-lavender tint instead.
- golden-hour key / cool fill as split toning (bright -> warm, shadow -> lavender).
- sky regrade by ray elevation: orange horizon -> pink -> purple, keeping the sky's own brightness and clouds, sun disc untouched.
- height haze: thick near the sea (y = -200), warm toward the sun, lavender away from it.
- screen-space rim: depth-discontinuity edges on the sun side of near objects get a warm sun-coloured rim.
- light shafts from the existing god-ray pass, forced on.
It works with `--mblur` (it runs per sub-frame). 2D frames are byte-identical with `--look k08b --mblur 8` (checked at 20.0).

Stills (1080p, t = 104.6): `k08b_104.6_before_1080p.jpg`, `k08b_104.6_after_look_1080p.jpg`,
`k08b_104.6_after_look_mb8_1080p.jpg`, and `k08b_104.6_triptych.jpg` (before | look | keyframe).

What post alone gets: the overall warm palette, the pink-orange sky band, lavender shadows, haze, a vignette and grain.
What needs the world:
- materials: real sandstone albedo and roughness with chipped edges, and per-block colour variation. Post tinting is uniform
  and also warms low-saturation props.
- grass: the flat green slab and voxel grass tufts, flowers and moss stay as they are. The saturated green is
  deliberately left alone by the grade.
- light: a true low golden key with long shadows and a cool hemisphere fill, so the shadow side is lit blue rather than
  just tinted. Also a sky with more purple, which needs `env.js`/`makeSky` and the sun direction.
- hero rim: a true rim needs normals (a fresnel term in the hero material or a dedicated rim light). The screen-space rim
  also lights platform and column edges.
- composition: camera, hero pose and blocking, the shaft placement and the cliff/sea view are cinematography, not grade.
- The rim strength (2.6) is a bit hot on platform edges. Tune it per shot, or limit it to heroes once a hero mask exists
  (`userData` layer).
