# WORLD API: the shared TALOS world (Team B, Act III; reused read-only by Team C act4 and Team D drop 2)

Code: `src/scenes/act3/world/` (`build.js` world, `props.js` set pieces, `paint.js` paint patch), plus the scene helpers in
`src/scenes/act3/common.js` and the colour ledger `src/scenes/act3/paintlog.js`. Don't edit these files; ask Team B
(or append to CORE_REQUESTS.md marked "world"). Import and use:

```js
import { getWorld, MESA_A, MESA_B, CHASM, SEA_Y, SUN_DIR, LOOK3D } from '../act3/world/build.js';
import { make3D, LOOK, V, aim, persp, faceCam, pathAt } from '../act3/common.js';
import { floodRadius, FLOOD } from '../act3/rap.js';
export async function setup(ctx) {
  const W = await getWorld(ctx);                  // built ONCE per page and cached; every act3/4/5 scene shares it
  return make3D(ctx, W, { frame(t, fx) {          // make3D: W.reset() + W.ledger(t) + your frame + post + smooth subtitles
    // ... set props / heroes / G paint uniforms for this frame (pure function of t)
    const camera = aim(persp('mycam', ctx.width / ctx.height), V(1300, 60, 520), V(1352, 30, 330), 50);
    return { camera, target: V(1352, 30, 330), focus: V(1352, 20, 330), look: LOOK({ dim: 1 }), shadowExtent: 600 };
  } });
}
```

## Contract
- **Shared instance.** `getWorld(ctx)` returns the same object to every scene. `W.reset()` (make3D calls it first every
  frame) restores the default state: props hidden, heroes/bugs hidden, local paint cleared, flood off (`G.uPaintR = -1`).
  Set everything you need every frame. Never keep state between frames.
- **Colour.** The world is unpainted plaster until coloured. Global flood: `G.uPaintC / G.uPaintR / G.uPaintW`
  (`import { G } from '../../util.js'`). After 119.02 the world is fully coloured: for scenes after Act III set
  `G.uPaintC.value.copy(FLOOD.c); G.uPaintR.value = floodRadius(t); G.uPaintW.value = 400` (or a large radius, e.g. 1e5).
  Per-material local colour: `mat.userData.lp` -> `.addSphere(x,y,z,r)`, `.capsule(a,b,r)`, `.wipe(y, edge)`, `.all(0..1)`,
  `.edge(w)`, `.glow(v, color)`. To *remove* colour (THE ERASER), drive the same uniforms down (e.g. shrink `uPaintR`
  from a centre, or `all(1 - u)`); the hatching edge then reads as an eraser rubbing back to plaster.
- **Flat 2D switch.** `G.uFlat` 1 = unlit pixel look (used by THE TURN); the look sets it from `L.flat`.
- **Heroes.** `W.heroes.{jade,charlie,ricky}` and `W.bugs.{ladybug,beetle,moth,caterpillar,firefly}` are `Actor.voxel()`
  groups. Place with `W.put(g, { x, y, z, anim, t | frame, pencil, facing, rotY })`. Jade's hair canon is enforced by
  Actor (pencil:true = hair down). Bugs: anims `idle`, `dance`, `feature` (button / wheel / glider / bridge / lamp).
  Sprites are flat-ish extrusions: keep the camera within ~50° of the sprite normal (local +z), or use
  `faceCam(groups, camPos, k)` / `rotY`.
- **Look.** `frame()` returns `look`: `LOOK({...})` = settled TALOS look (golden hour). Useful overrides: `dim` (0..1,
  darkens sun/sky/exposure: dusk/blackout), `exposure`, `bloomAmt`, `dofAmount`, `rays`, `atmos`, `sat`, `hemi`.
  The sun direction is `SUN_DIR` (low, ahead at +x). `W.setSun(dir)` changes it (regenerates the IBL once per change; dusk:
  lower y). Subtitles: make3D shows the smooth bilingual slot for Act III lines; pass `subs: false` to own them.

## Geography (world units: 1 = one sprite pixel, heroes ~44 tall; y up; +x = forward, the sun is ahead)
| What | Where |
|---|---|
| Causeway = the party's drawn level (coloured grass/dirt strip, Team A tiles) | top y = 0, z in [-24, 24], x -408 .. 4400 |
| 出发 gate (rainbow voxels) + lamp, Act II launch set | x -20 .. 158 (`props.gate2`, `props.lamp`) |
| Cypress avenue (9 trees, one material each) | z = -47, x = 262 + 74k (`W.avenue`, `W.avenueLP`) |
| Colonnade / temple front / great gate / monument (prototype, mirrored) | z -78 and -170, x 300 .. 1250; gate (1050, -330); monument x 2650 |
| Meadow + hills (prototype heightfield) | z < -24; `W.groundY(x, z)` |
| Sea | y = `SEA_Y` = -200, z > ~100 |
| Mesa A (verse 2 meadow, flowers, BECAUSE, co-op near side) | `MESA_A` x 560..1000, z 260..540, top 10 |
| Chasm + the 一 stroke bridge | `CHASM` x 1000..1090, the 一 InkStroke bridge at z 410 |
| Mesa B (amphitheatre, stage, rap, flood origin) | `MESA_B` x 1090..1560, z 240..560, top 10; stage centre `props.stageC` (1360, 10, 450) |
| Flood origin (the planted giant pencil) | `FLOOD.c` = (1354, 10, 454) |

## Props (`W.props`, all hidden by reset unless noted)
`drawnStrip` (always visible), `gate2`, `lamp`, `voidWall` (blueprint tiles; `material.uniforms.uT` = seconds since the break),
`blocks[12]`, `chant[4]` (一笔一画 BlockHanzi, `g.hz.setProgress(stroke, p)`), `tramp`, `hatStack`, `boomer`,
`slabs[6]` (graphite, `fixturesText`, `functionsText`, `slabGlowMat`), `beam` / `beam2` (`Beam.set(points, p, {width, colors})`),
`switches[2]`, `flowers` (FlowerField `.update(growFn, t)`), `because`, `plate`, `gate`, `tripod`, `receiver`, `yiBridge`,
`mesaRuins`, `stageDisc`, `seats`, `arch`, `spots[3]` ({cone, light, pool}), `books[6]`, `monolith` (`userData.draw(text, cursor, glow)`),
`pencil` (giant every-colour pencil), `star`, particle bursts `burst` / `petals` / `sparks` (`Burst.run(t, events)`, closed form),
`BAND` (stage positions). Builders you can reuse: `textTexture`, `blockLetters3D`, `BlockHanzi`, `InkStroke` (calligraphy stroke, `setColour(u)`), `dilateHanzi`, `gizmoCube`, `marbleTexture`, `Burst`, `Beam`, `makeDrawnStrip`.
Heroes are built with `voxel({ back: true })` (back-view strips) and deeper extrusion.

## Performance
Setup ~1.6 s (first scene only). 540p review renders of 45 s take ~40 s with `--workers 3`.
