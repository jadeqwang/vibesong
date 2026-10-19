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

## Density layer (2026-10-15)
`W.detail` (src/scenes/act3/world/detail.js): hill temples, terraces, stoa, triumphal arch, aqueduct (x 1620..3900, z 175,
top y -14), sea stacks, ~110 voxel cypresses, stepped voxel strata on the inland hills. Decoration only (no anchors), plaster
until coloured, top-level scene children. Gameplay coordinates above are unchanged (colonnade column positions included).
`W.applyLook` now re-asserts the shared world's sun every frame (Act V's world wrote the global sun uniform directly).
Heroes: `Actor.voxel()` defaults to density 2 (half-size voxels, same world size), uses `<strip>_hi` art (ART_REQUESTS A-3),
face-culled meshes with baked AO; `HI_HOLD` in src/core/sprites.js lists `_hi` strips held back for canon fixes.

## Composition layer + sculpted heroes (phase 2)
`W.compose` (world/compose.js): floating ink-stroke sculptures, sea arcade, wide-shot parapets, voxel islands, per-shot
framing (time-gated inside Act III only). Heroes are rigged voxel figures (src/core/voxfig.js) behind the same
`Actor.voxel()` / `W.put()` API; `voxel({ figure: false })` gives the old extruded sprite.

## Performance
Setup ~12-17 s (first scene only; world build). 1080p ~240 ms/frame wall on the RTX 3090 (was ~200 ms), GPU render ~6-18 ms.

## Battle UI (BATTLE UI team, 2026-10-15) · `src/show/battle_ui.js`
The 2D JRPG overlay for the bug battle (107.15-123.35), THE ERASER's warning (123.18) and the final-boss menu
(143.48-154.24). Pure function of song time t (same pattern as `build_bar.js`); every time is in the tables at the top
of the file (`BATTLE`, `ACTIVE`, `ACTS`, `HEARTS`, `CONVERT`, `TAGS`, `ACTION`, `LYRIC_LINES`, `CMDS`, `BANNERS`,
`FLOWERS`, `CORRUPT`). Retime there, never in scenes. Look = the half2 mocks: 384x216 canvas, x5 at 1080p, no smoothing,
Fusion Pixel fonts, half-1 HUD palette. Windows are in the bottom band (y 159..213 of 216); pop-ups (SKILLS cascade,
`>` text field, tech banner, VICTORY, THE ERASER's ♥ window) are in the strip just above it (y 140..158).

**Hook it into a make3D scene (Act III):**
```js
import { makeBattleUI, battleOwnsSubs, battleAt } from '../../show/battle_ui.js';
const bui = await makeBattleUI(ctx);                      // in setup (loads fp fonts, builds 16 px portraits)
// in frame(t):
bui.update(t, { anchors: { firefly: fireflyGroup.position, jade: headPos }, camera });   // anchors: see below
return { camera, ..., ui2d: bui.ui2d, noSubs: battleOwnsSubs(t) };
```
If the scene already returns a `ui2d`, call `bui.render(renderer, target)` from `render()` instead.
**Act IV (`main3d.js`):** before `update`, `api.suppressSubs = battleOwnsSubs(t)`; at the end of `render(t, target)`:
`bui.update(t, {...}); bui.render(ctx.renderer, target)`.
**Subtitles:** `battleOwnsSubs(t)` is true in [107.03, 123.41) and [143.36, 154.49): there the message window IS the
subtitle (lyric typed from `lyrics_timed.json` word times, translation under it). Pass it as `noSubs` / `suppressSubs`.
At 123.18 the red `THE ERASER draws near!` window sits at y 148..169 (just above the SmoothSubs box), so line 34 shows
normally from 123.41.

**Anchors (floating tags):** `♥+1` (every `HEARTS` event, at the enemy), `MISS` / `GUARD` (`TAGS`, at a hero),
`BUG → FEATURE` (`CONVERT`, at the bug). Pass `anchors: { id: THREE.Vector3 (world, needs camera) | [u, v] }` with
[u, v] = normalized screen, top-left origin (`bui.project(vec3, camera)` / exported `project()` gives it). Ids: `ladybug`
`beetle` `moth` `caterpillar` `firefly` `eraser` `jade` `charlie` `ricky`. A tag whose target has no anchor is not drawn
(`makeBattleUI(ctx, { fallbackAnchors: true })` uses `DEFAULT_ANCHORS`, preview only). `nameTags: true` also draws the
mock-style name + ♥ tag over each bug (optional; it is outside the bottom band).

**Read the state to sync the world:** `battleAt(t)` -> `{ visible, phase ('battle'|'victory'|'recruit'|'near'|'final'|'off'),
slide, swirl (0..3 or -1), ownsSubs, hearts{id}, full{id}, converted{id}, active [hero ids], party [ids], cmd, banner,
corrupt, action, lyric }`. Also `heartsAt(t, id)`, `convertedAt(t, id)`, `activeAt(t)`, `partyAt(t)`, `battleTagsAt(t)`.

**What it draws, when** (cues: act3/common.js CUE, lyrics word times, timing.json beats):
| t | UI |
|---|---|
| 107.15 | 4-frame battle transition: the frame (copied from the framebuffer) breaks into the half-1 pixel grid (320→40 columns) and swirls |
| 107.283 | windows slide up: enemy list (empty) · message · party |
| 107.615 / 108.195 / 108.835 | party rows pop in on the stage stops: JADE·PAINT, CHARLIE·SHIP, RICKY·RUN (lit portrait) |
| 109.14 | 5 enemy names, one per 8th, empty ♥; `BUGS ×5 draw near!` |
| 110.41-111.86 | Jade's menu: FIGHT struck + `not very effective`, cursor PAINT; SKILLS ▸ cascade (for(;;) { } ; 语法) topples one window per syllable of 用背语法; `> let's dance` field 111.24, ENTER on 111.705; MISS ×3, every bug ♥+1 |
| 112.07-116.91 | turns 2-4 (enemy half → party half): active pair lit, ♥ per action, name yellow when full, name swaps to the feature + BUG → FEATURE (113.28 lamp, 114.95 glider, 116.51 wheel); flowers burst out of the message window frame on 开 114.998 |
| 116.88-117.23 | boss glitch: party window corrupts (garbage glyphs, checker portraits, red/magenta frame) |
| 117.23 / 117.3-117.95 | GUARD on Charlie, MISS ×2; menu cursor runs FIGHT→…→TECH |
| 117.65-118.95 | banner `TRIPLE TECH · 一笔一画`; 草 / run / 稿 / ship fill ladybug + caterpillar; 118.469 bridge, 118.659 button |
| 119.02-120.75 | `★ VICTORY ★`; enemy window closes, message widens |
| 121.405 | DQ prompt `The BUGS look at you longingly. Let them join your party? ▶YES NO` (replaces the lyric page: see gaps) |
| 121.745 | YES pressed (Charlie's button); 121.946…122.75 party strip 3 → 8, one per 8th; `+5 FEATURES joined` |
| 122.95 | slide away |
| 123.18-124.45 | red flash window `THE ERASER draws near!` |
| 143.48 | last menu (FIGHT struck, cursor PAINT), party strip 8; 144.0 the menu gives way to the `>` field |
| 144.27-147.218 | `> an eraser` typed on the syllables; ENTER on "need" 147.358 |
| 147.6-149.22 | THE ERASER ♥ window (strip), finisher action lines on the beats 147.793 / 148.191 / 148.59 / 148.989 |
| 149.22 | `THE ERASER joined the party! Class: UNDO`, party 8 → 9 (pink eraser portrait); 154.24 slide away |

Preview: `node render.js --show dev --stills 111.7:a.png` (dev entries `dev.battle_a` [106,124.6), `dev.battle_b`
[143,155): `src/scenes/dev/battle_ui_test.js` draws the overlay over the current act3/act4 scenes; `?plate=1` uses the mock clean plates).

## Creatures (CREATURES team, 2026-10-16): 3D-native bugs, features, morph, draft, the sculpted Eraser
Code: `src/core/creatures/` (index.js factories; vox.js SDF kit + voxelizer; bugs.js; features.js + feature_anims.js; morph.js;
eraser.js). Dev turntables: show `dev`, entry `dev.creatures` (t 1000..1400, src/scenes/dev/creatures_test.js). Review sheets:
out/review/creatures/. Nothing here is wired into a scene yet; W.bugs (extruded sprites) is unchanged.

```js
import { makeBug, makeFeature, makeMorph, makeDraft, makeEraser, BUG_NAMES, FEATURE_OF, VOXEL } from '../../core/creatures/index.js';
import { patchPaint } from '../act3/world/paint.js';
const onMaterial = (m) => patchPaint(m, { noPaint: true, hero: true });   // optional: same rim/fill as the heroes
const lb = makeBug('ladybug', { onMaterial }); W.scene.add(lb);           // build once in setup (all ten: < 1 s)
// every frame (pure function of t; scene owns placement):
lb.visible = true; lb.position.set(x, floorY, z); lb.rotation.y = a; lb.set({ anim: 'dance', t, beat: T.beatAt(t) });
```
- **Frame**: origin = feet / base centre, **face toward +x**, y up (the wheel's face is on **+z**, its axle). `rotation.y = θ`
  turns the face to (cos θ, 0, −sin θ). The firefly hovers (body ~9 units up). Default voxel `VOXEL` = 0.45 world units
  (bugs 41-53 voxels = 18-24 units long; heroes ~44-50 tall). `opts.s` changes it (same for bug/feature/morph of a pair).
- **makeBug(name, { s, onMaterial, light })** names: ladybug, beetle, moth, caterpillar, firefly. `g.set({ anim, t, beat, ... })`:
  - `idle` (breath, blink, antennae, flutter) · `dance` (beat-locked bounce/sway; ladybug opens its shell, moth flaps,
    caterpillar ripples, firefly figure-8) · `bug` = its software bug, as a loop on the beat:
    firefly blinks OFF the beat (`g.userData.U.glow` 0..1 = flicker the light it lands on), moth dives forward and bonks
    (`U.bonk` = 1 on impact frames, knock a spotlight), beetle rolls a tight circle (`U.ringR` world radius; its root moves
    on the circle around the placement point), caterpillar grows extra tail segments (`overflow` 0..6, default 1 per beat,
    resets every 8 beats; extras are NOT in the morph count), ladybug flashes its spots (`U.flash`).
  - params: `blink` (0..1 override), `glow`, `flash`, `overflow`, `ringR` (voxels), `lightK`. `light: true` adds a PointLight to
    the glow part (off by default: light count changes recompile every material).
- **makeFeature(name | bugName, opts)**: lamp, glider, wheel, bridge, button. Same voxel COUNT as its bug (exact) and the
  same eye balls. anims `idle` / `dance` / `use` (+ wheel `roll`). params: lamp `glow`; glider `bank`, `flap`; wheel `roll`
  (rad) or `dist` (world units rolled toward +x); button `press` 0..1 (`U.press`), `flash`.
- **makeMorph(bugName, opts)** → group with its own bug + feature: `mo.set({ u, t, beat, anim, to: [dx, dy, dz] })`.
  u ≤ 0 shows the bug (anim), u ≥ 1 the feature, between: N instanced voxels fly in stroke order (arc, integer spin turns,
  ease, stagger, colour lerp, glow carried). `to` = feature offset from the bug origin (world units, local to the group).
  Drive u from time, e.g. `u = clamp01((t - T0) / 0.6)`. Opts: `arc`, `spin`, `stagger` (0..0.6).
- **makeDraft(bugName, { resolution: [w, h], width: px, color })** → `dr.set({ p, fill, opacity })`: pencil-gray outline-only
  render (triple tech 草稿), p = stroke-ordered reveal 0..1, `fill` optional paper body. Pass the render size in `resolution`.
- **makeEraser({ lod: 'lo'|'mid'|'hi', onMaterial, sleeve, crumbs })**: sculpted voxel Eraser, **face toward +z**, origin
  bottom centre, model height 1.6 (same units as act4/eraser3d.js: `e.scale.setScalar(heightWorld / 1.6)`).
  `e.set({ pink 0..1, face: 'grumpy'|'look'|'happy'|'sing', blink, cap, hatch, scrub, lean, squash, wave, sleeve, crumbs })`
  (eraser3d's set() names plus `cap` / `hatch`). `hatch: true` = Act IV's top-down coloured-pencil wavefront for pink 0..1.
  LOD = voxels across the width: lo 60 (distant), mid 120 (hero scale), hi 240 (mountain: face 206 voxels wide). Builds
  ~0.5 s (mid) / ~3 s (hi) once per page; face slabs per expression are built lazily on the first set() that uses them (not timed separately; warm them in setup).
- **Perf (RTX 3090, 1080p, shared world)**: wall/frame 230 ms bare world · 248 ms with 10 animated creatures · 230 ms with
  5 morphs in flight (≈ 50k instanced voxels) · 233 ms with the hi-LOD mountain Eraser. CPU set(): bug/feature ≤ 0.012 ms,
  morph 0.4-1.4 ms (4.5k-14k voxels), Eraser 0.6 ms. Build: all bugs + features + morphs + drafts ~0.8 s.

### Creatures round 2 additions (2026-10-16, additive: every round-1 call still works unchanged)
- **Upright stance**: `makeBug(name, { stance: 'upright' })` sets the default; `g.set({ stance: 'upright' | 'crawl' })` overrides
  per frame. Hind legs stand, front legs become arms (they pump on the beat in `dance`), the head turns front-on with a
  slight upward tilt for a 3/4 high battle camera. `idle`, `dance` and every `bug` loop compose with it (it is applied after
  the anim). Caterpillar upright = front half curves up off the ground. Firefly upright = pitched hover. Tunables:
  `STANCES` (exported from index.js). Upright heights: ~26-31 voxels (12-14 units); the face is at the top.
- **Morph from the live pose**: `mo.set({ u, from, featureState, ... })`. `from` = a state object for the morph's own bug
  (`{ anim: 'dance', t, beat, stance: 'upright' }`), or the scene's own bug Group (same bug kind): voxels then take off from
  that live pose, and the morph never draws its internal bug, so hide yours once u > 0. `featureState` = landing pose.
  Default (no `from`) = the bug posed with this call's `anim`/`t`/`beat`/`stance`, so u = 0 matches what is on screen.
- **Draft is posable**: `makeDraft(name, { stance, resolution, width })`; `dr.set({ p, fill, opacity, anim, t, beat, stance })`.
- **Wheel face stays upright while rolling**: tyre, hub and horns spin on joint `spin`; the eyes and mouth stay on `head`.
- **Lamp eyes** are 0.75x the shared eye. Moth and glider share the bigger moth head (r 8.4) and eye offsets. The beetle's
  `metal` material has a fresnel rim (`userData.rim` uniform, default 0.55) and lighter top facets.
- Voxel counts changed with the new shapes (still exact per pair): ladybug/button 13938, beetle/wheel 14558, moth/glider
  9698, caterpillar/bridge 4682, firefly/lamp 4486. CPU: morph set() 0.4-1.5 ms (now samples both poses), draft 0.02 ms.
