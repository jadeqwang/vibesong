# look_r5 (round 5): the diorama look preset `LOOK_R5` for 86.385-173.02 (behind `--r5`)

Owner files: src/look.js, src/post.js, src/env.js, src/scenes/act3/world/* (column density / clutter controls only).
Also touched (flag plumbing only, one line each; coordinator dedupes with talos_r5): render.js (`--r5` -> `?r5=1` on the page
URL), src/scenes/act3/common.js (`R5()` helper). Backups of every file before the first edit: engine/out/bak_r5/look_r5/.
Scratch: engine/out/dev/look_r5/ (frozen A/B trees + stills; deleted at the end). Review: engine/out/review/look_r5/.

Status: M1 reached (preset implemented, API live, A/B verified, M1 sheet rendered); STOPPED for the coordinator's notes.

## Flag
`--r5` (render.js) / `?r5=1` (dev page). The preset is a LAYER ON TOP OF `--look k08b`: with `--r5` but without `--look k08b`
nothing render-side changes (no LookPass exists). Review flags: `--fig native --figscale 1.3 --figres 2.5 --look k08b --r5`.
Without `--r5`, default renders and `--look k08b` renders are byte-identical to before (A/B at 90.4 / 116.5 / 139.4, see below).
Time gate: the preset is active for song time 86.385 <= t < 173.02 only (Act V keeps its own look).

## API (what the scene units call)

```js
import { r5Shot, r5On } from '../../look.js';     // src/scenes/act3/*.js and src/scenes/act4/*.js (same relative path)
import { R5 } from './common.js';                 // act3; act4: '../act3/common.js'. R5() = the flag alone (true/false)
```

`r5On(t)` -> true when the flag is on, `--look k08b` is on and 86.385 <= t < 173.02 (i.e. the preset will apply to this frame).

### `r5Shot(o)` - per-shot overrides (call it from frame(t), every frame you want it; it applies to that frame's render only)
Every field is optional; a missing field keeps the preset's per-range default (table below). Alternative with the same effect:
put the same object in your look: `look: LOOK({ ..., r5: { dof: 0.7, focus: V(660, 20, 110) } })`.

| field | type / unit | default (preset) | what it does |
|---|---|---|---|
| `dof` | 0..1 (0 = off) | Talos 0.7, stage 0.55, flood 0.45, Act IV 0.4-0.5, the lock 0.3, rebuild/swarm/cart 0.55 | tilt-shift strength: aperture = 2.2 * dof over `dofMaxPx`. At 0.7: the subject at focus sharp, 2x the focus distance ~18 px, the far ground / sky-line 24 px (1080p) |
| `focus` | distance (world units) OR a Vector3 | the scene's own `focus` (or `target`) | the sharp plane (distance from the camera) |
| `dofMaxPx` | px at 1080p | 24 | max blur radius (the k08b default chain uses 7) |
| `tilt` | 0..1 | Talos 0.4, stage 0.3, Act IV 0.2, the lock 0, rebuild 0.3 | the tilt-shift screen band: rows far above / below the focus point's screen height blur regardless of depth (the band centres on the shot's `focus` point) |
| `protectL` | linear luminance | 2.0 (0.9 in 135.6-149.22) | HDR emissives brighter than this (the beam, the glyph) are untouched by the grade AND kept sharp by the DOF |
| `protectSat` | chroma / luma | 2.2 (1.6 in 123.354-149.22) | deliberately saturated accents above this (pencil caps, straps, the rainbow, the colour shards) keep their colour |
| `keyElev` | degrees | 9.5 (86.385-94.204), 11 (94.204-101.0), 12 (101.0-107.15), 12.5 (107.15-123.18), then the time-of-day | sun elevation (lower = longer shadows). The terrain decides how low you can go: Room B (azimuth turn 42) and the stage are in the inland hills' shadow at 11.5 and below (the whole room goes black); Room A is fine at 9.5, Room 2 at 11 |
| `keyAz` | degrees, absolute | the scene's azimuth (SUN_DIR / W.setSun) | sun azimuth about +y: 0 = toward +x (ahead of the party), 90 = toward +z (the sea side), -90 = inland |
| `keyTurn` | degrees, relative | 0 (same as the existing `k8SunAz`) | turn the scene's azimuth |
| `rim` | multiplier | 1.4 | hero / bug rim light (sun side warm, sky side cool) |
| `pair` | `[A, B]`, each `'#rrggbb'` or `[r, g, b]` sRGB 0..1 | per range (table below) | the two-colour grade target: chroma aligned with A or B is kept, everything else is desaturated and pulled toward the nearer of the two; A also tints the lit side, B the shade |
| `pairAmt` | 0..1 | 0.7 Talos + stage, 0 during the flood 119.02-123.354, 0.75 Act IV, 0.65 rebuilt world | strength of the two-colour grade. Heroes and creatures are EXCLUDED from it: every material patched with `patchPaint(m, { hero: true })` (the heroes, the bugs, battle_cast, world4's heroes) writes alpha 0.5 into the scene target under --r5 and the grade skips those pixels, so canon colours (Jade's white jacket, skin, the bug colours) stay as painted while the world pulls to the pair |
| `warm` | 0..1 | 0.45 (k08b: 0.22) | re-tint of low-saturation surfaces toward sandstone |
| `flare` | 0..1 | 1; 0 in 135.6-143.48 (the lock) and 154.26-160.83 (the swarm) | the sun flare: god rays, the sun disc + halo in the sky, anamorphic streaks |
| `beam` | 0 / 0..1 | on in 89.95-91.085 (1.0) and 101.0-107.13 (0.85), off elsewhere (explicitly 0 in the lock and the swarm) | the art-directed sunbeam from the upper left (lands behind-left of `target`). `LOOK({ k8Beam: 0 })` (talos_r4's request) is honoured too, with or without --r5 |
| `skyGain` | multiplier | 1 (1.3 in 123.354-129.34) | brightness of sky pixels (the luminous dusk sky behind the Eraser) |
| `lift` | 0..0.2 | the time-of-day's (0.07 golden, 0.08 dusk; 0.12 in 123.354-129.34) | lifted cool blacks (the band's backs at dusk) |
| `sunGain`, `hemiGain` | multipliers | 1.1 / 0.9 (hemi 1.3 in 123.354-129.34) | key vs fill |
| `columns` | `{ keep: [ids] }` / `{ cull: [ids] }` / `{ thin: n, sets: ['A','B','S'] }` / `{ all: false }` | per range `keep` lists (table below): every other registered column is culled | column density: `keep` culls every registered column NOT listed; `cull` culls the listed ones; `thin: n` keeps every n-th column of the listed sets (deterministic, by registry index; `keep` ids are never culled); `all: false` culls every registered column. A per-shot `columns` REPLACES the range default (pass `columns: { cull: [] }` for "cull nothing") |
| `zones` | `[[x, z, r, y0, h], ...]` | none | extra cull cylinders for anything not in the registry (e.g. a far temple's peristyle) |
| `vignette`, `grain` | 0..1 | 0.34 / 0.03 | lens |

One snippet per use:

```js
// 1. the Room A lock wide (86.4): long lens, focus on the stele, strong falloff, only the two colonnade columns that frame the gate
r5Shot({ dof: 0.7, focus: V(720, 30, 150), columns: { keep: ['A4', 'A5'] }, pair: ['#f0cf9a', '#8a7fb8'] });

// 2. the glamour frame (90.375): beam on, key behind-left of the party (absolute azimuth), focus on the receiver, no culling change
r5Shot({ beam: 1, keyAz: -135, keyElev: 9, focus: V(760, 30, 300), dof: 0.5 });

// 3. first person (102.768-104.396): DOF off, beam off, no rim
r5Shot({ dof: 0, beam: 0, rim: 0 });

// 4. the lock (139.395): paper + one accent, tilt-shift band, nothing else
r5Shot({ dof: 0.7, tilt: 0.4, focus: jadePos, pair: ['#efe2d2', '#e8905a'], pairAmt: 0.6 });

// 5. the swarm wide (157): thin the stoa to every third column, keep mesa B's two tall ones
r5Shot({ dof: 0.45, columns: { thin: 3, sets: ['S'] , keep: ['M0', 'M1'] } });   // keep + thin combine: thin applies to `sets`, `keep` is always kept

// 6. same thing from the look object (no import of r5Shot needed)
return { camera, target, focus, look: LOOK({ rays: 0.3, dofAmount: 0.18, r5: { dof: 0.6, columns: { keep: [] } } }), shadowExtent: 650 };
```

### Column registry (authoring aid) - `W.r5` (only with --r5; `undefined` otherwise)
- `W.r5.columns` -> `{ id: { x, y, z, top, r, set } }` (world coords; `top` = capital height above `y`).
  Sets / ids: `A0..A12` the prototype colonnade's front row along the causeway's meadow side (z -78, x 300..1250; the ones that fill the
  Talos frames), `B0..B11` its back row (z -170), `G0, G1` the great gate (x 1050, z -330), `M0..M3` the mesa-B ruin columns
  (1130,290 / 1160,382 / 1112,432 / 1545,520), `S0..` the stoa down the causeway (x 1660..2480, z -96), `R0, R1` the arch behind the
  stage, `C88a, C88b` (compose's 88.0 sea columns), `C101` (the 101.5 stump), `C108` (the 108.0 framing column).
- `W.r5.columnsInView(camera, { margin = 0.05 })` -> `[{ id, sx, sy, dist, set }]` (screen 0..1, nearest first) for the columns inside
  the frustum: call it once from a dev script / console to pick your `keep` list, then hard-code the ids (no per-frame auto-picking:
  a camera move would make the set pop).
- Culling is a fragment discard inside each column's cylinder (radius ~2 x the column radius, from its base to its capital) on every
  stone material and on its shadow-depth material: the column AND its shadow go; entablatures stay (a lone architrave over a gap reads
  as a ruin). Heroes, bugs and gameplay props are never culled. Known: GTAO still sees the column (a faint AO halo at its foot).

### Per-range preset defaults (what you get for free with --r5)
| range | dof / tilt | pairAmt | pair A | pair B | columns kept | key elev | other |
|---|---|---|---|---|---|---|---|
| 86.385-94.204 Room A | 0.7 / 0.4 | 0.7 | #f0cf9a sand | #8a7fb8 lilac sky | A4 A5 C88a | 9.5 | beam 89.95-91.085 |
| 94.204-101.0 Room 2 (the climb) | 0.7 / 0.4 | 0.7 | sand | lilac | A4 C101 M2 | 11 | |
| 101.0-107.15 Room B (co-op) | 0.7 / 0.4 | 0.7 | sand | lilac | M1 M2 C101 | 12 | beam 101.0-107.13 |
| 107.15-119.02 stage + rap | 0.55 / 0.3 | 0.7 | sand | #7d6cb0 k08 purple | R0 R1 C108 | 12.5 | |
| 119.02-123.354 flood / wave | 0.45 / 0.2 | 0 (the colour is the point) | | | R0 R1 C108 | 12.5 | |
| 123.354-129.34 the Eraser rises (dusk) | 0.4 / 0.2 | 0.75 | #efe2d2 paper | #e8905a peach | R0 R1 M1 | time of day | skyGain 1.3, lift 0.12, hemi x1.3, protectSat 1.6 |
| 129.34-135.6 the erased world | 0.4 / 0.2 | 0.75 | paper | peach | R0 R1 M1 | tod | protectSat 1.6 (the colour shards) |
| 135.6-143.48 the lock | 0.3 / 0 | 0.75 | paper | peach | R0 R1 M1 | tod | flare 0, beam 0, protectL 0.9 (the glyph), protectSat 1.6 |
| 143.48-149.22 `> you` | 0.5 / 0.2 | 0.75 | paper | #f0b060 peach-gold | R0 R1 M1 | tod | protectL 0.9, protectSat 1.6 |
| 149.22-154.26 the rebuild | 0.55 / 0.3 | 0.65 | #f3e4c8 cream | #4f9fb0 teal-blue | R0 M1 M2 | tod | |
| 154.26-160.83 the swarm | 0.55 / 0.3 | 0.65 | cream | teal-blue | R0 M1 M2 | tod | flare 0, beam 0 |
| 160.83-173.02 the cart, 99 %, the speedrun | 0.55 / 0.3 | 0.65 | cream | teal-blue | R0 M1 M2 | tod | |
Light under --r5: sun gain x1.1, hemisphere fill x0.9 (a stronger key-to-fill ratio), hero rim x1.4, warm re-tint 0.45, vignette 0.34, grain 0.03.
The dusk preset (123.18-139.7) is re-graded under --r5 (look.js R5_TOD): exposure 1.15 -> 1.32, lift 0.06 -> 0.08, lighter warmer fog
(fogAmb 0.7 -> 0.5), hemisphere sky/ground bounce up, env 0.42 -> 0.48; 123.354-129.34 adds skyGain 1.3 / lift 0.12 / hemi x1.3
(the luminous sky behind the Eraser silhouette, the band's backs lifted).

## 1080p master settings
`node render.js --show main --from 86.385 --to 173.02 --res 1920x1080 --fig native --figscale 1.3 --figres 2.5 --look k08b --r5 --mblur 8 --shutter 0.33 --workers 1 --mp4 ...`
(`--shutter 0.33` = 120 deg; the shutter opens at t so beat cues stay on their frame; see checkpoints/look.md).
Per-frame cost (1080p, 112-114 / 112-113, 1 worker, shared GPU, tree B; "render" = update + GPU, wall includes the readback):
no blur: k08b 30.5 ms render / 294 ms wall -> k08b + r5 29.6 / 317 (within noise; the readback dominates);
--mblur 8 --shutter 0.33: 128 ms render / 402 wall -> 137 / 387 (+7 % GPU; the 64-tap DOF and the cull loop are the only additions).
Full second half (86.385-173.02 = 2,599 frames) at 1080p mblur 8: ~17 min on 1 worker.

## Done / not done
- [x] API published (above) and kept current.
- [x] flag plumbing: env.js `LOOKCFG.r5` (same test as talos_r5's `R5()` in common.js; talos_r5 added `--r5` -> `?r5=1` to render.js, I did not touch render.js or common.js).
- [x] tilt-shift DOF (post.js `makeDofMat`: the default 32-tap shader string is unchanged byte for byte; the r5 variant has 64 taps, 24 px, the screen band centred on the shot's focus point, HDR emissives above `protectL` kept sharp).
- [x] light (k08b.js: per-room elevation table `SUN_ELEV_R5`, `keyElev` / `keyAz` / `keyTurn`, rim x1.4, sun x1.1 / hemi x0.9, beam per shot + `k8Beam`).
- [x] two-colour grade (look.js `pairGrade` in the HDR LookPass: off-pair chroma desaturated and pulled toward the pair, pair-driven split tone, `protectL` / `protectSat`; per range + per shot), flare per shot (god rays, sun halo, streaks), `skyGain`, `lift`, `warm`.
- [x] column density (r5cols.js registry replayed from the builders' seeded RNGs + paint.js fragment cull on every world material and on a shared shadow-depth material; per-range `keep` defaults, per-shot `columns` / `zones`).
- [x] dusk: R5_TOD dusk re-grade + the 123.354-129.34 range (skyGain / lift / hemi).
- [x] A/B byte-identity without --r5 at 90.4 / 116.5 / 139.4, default flags AND `--look k08b` alone: all six `cmp` IDENTICAL (max pixel diff 0), re-verified after every pass (frozen trees A = pre-edit snapshot, B = A + my files only).
- [x] M1 sheet (first pass, coordinator: too timid) -> M1b sheet (second pass): out/review/look_r5/m1b_sheet.jpg. M1b PASSED.
- [x] post-M1b tweak (coordinator): pairAmt 0.7 in Talos / stage, heroes + creatures masked out of the grade (paint.js: hero materials write alpha 0.5 into the scene target under --r5; look.js reads it as tScene and skips those pixels). Verified at 1080p, 2x crops in out/review/look_r5/m1c_hero_crops.jpg: 109.2 the ladybug went orange and the beetle grey-blue before the mask, both are as painted with it; 90.375 Jade's white jacket / skin / orange straps as painted (the live r5 staging puts her out of focus in that shot, talos_r5's choice). The magenta checkerboard on the bugs at 109.2 is battle_r5's glitch state (present with and without the mask), not the grade. A/B without --r5 (default flags and --look k08b alone, 90.4 / 116.5 / 139.4): all IDENTICAL again (tree A = the tweak reversed, since the live act4 / battle files now import r5Shot and the round-4 backups no longer run with them).
- [x] per-frame cost (above).
- [x] (act4_r5 REQUEST, promoted by the coordinator) post.js: under --r5 the DOF / outline depth reconstruction takes near / far from the
  camera's PROJECTION MATRIX (`nearFar(camera)`, perspective and orthographic) instead of camera.near / far: legacy lookFrom() shots keep a
  construction projection (near 0.5) while setting camera.near = dist * 0.02, so the focus distance was wrong on every such shot (Act IV's
  camTail / pencil-tip shots, any act3 shot that never updates its projection). Without --r5 it is camera.near / far exactly as before.
  Verified on 166.5 / 170.2 (act4 camTail, still lookFrom): out/review/look_r5/m1d_nearfar_166.5.jpg (k08b | r5 before | r5 after).
- [ ] M2 (540p mp4 of the range): not started, waiting for the coordinator's notes.

## Self-review against the look rules (M1b, out/review/look_r5/m1b_sheet.jpg; mine vs the scene unit's)
Legend: [L] = the preset's job (done / not done), [S] = the scene unit's (camera, staging) - flagged, not mine to fix.
- 86.4 (Room A, ref k07): camera at chest height [S ok]; one warm key, long shadows (9.5 deg) [L ok]; two colours: the frame now
  reads sand + lilac, the meadow pulls olive-sand, only the caps / straps / the 4-cube keep their hue [L ok]; columns: 0 in frame
  (A3 culled, A4/A5 are off-frame right) [L ok]; focal subject: the trio ~1/2 frame height [S ok]; layers: fg grass band (soft) /
  trio (sharp) / wall + sea (soft) [L ok]; sky ~1/3 [S ok]. The near grass is still the drawn level's always-coloured strip (kind 9):
  it goes olive, not sand; making it plaster would change the approved half-1 asset's meaning, so I left it.
- 90.375 (the beam, ref k08b): camera is ABOVE the party looking down ~25 deg [S: lower it]; sky almost none [S]; the beam and its
  far target: the receiver is now soft at 24 px (the beam itself is protected, HDR) - if the far receiver must read, the shot needs
  `focus` between the amp and the receiver or dof 0.4 [S, one line]; columns: the ten far colonnade columns (A7-A12, B7-B11) are
  culled, A5 + C88a frame the shot [L ok]; two colours: sand + the beam's pink (the lilac is only in the far haze) [L ok].
- 104.6 (co-op, ref k08b): camera at chest height [S ok]; the far colonnade row (A3-A12, B2-B11) culled, M1 / M2 / C101 kept
  [L ok]; sky ~1/4 [S]; the far receiver + curtain soft [S: focus]; the sunbeam is on (101-107.13) [L ok].
- 109.2 (party intro, ref k08): camera low (bug height) [S ok]; the back colonnade culled, the arch (R0/R1) kept [L ok]; no sky
  (the camera looks at the colonnade wall) [S]; the bugs are the focal subject, sharp, background soft [L ok]; sand + purple [L ok].
- 139.395 (the lock, ref k11): flare off: the sun no longer blows out the glyph [L ok]; the glyph keeps its rainbow (protectSat) but
  is still SOFT: Act IV's focus is not on the glyph plane and protectL 0.9 does not catch it (the hatched glyph sits at ~0.5-0.9
  linear) [S: act4_r5 sets `focus` on the glyph, or passes protectL 0.5 for that shot]; paper + peach [L ok]; the Eraser's eyes
  top right, Jade absent [S].
- 157.0 (the swarm, ref k09 as the nearest): focal trio sharp, background soft [L ok]; cream + teal-blue, the pink wheel-bug and the
  pencils survive [L ok]; flare off (the sun was dead centre) [L ok]; columns: R0 (behind Charlie) + M1 / M2 kept, the rest culled
  [L ok]; camera at chest height, sky ~1/3 at left [S ok; act4_r5 is re-staging it higher and wider].
- 124.6 (dusk check, ref k10): sky luminous behind the Eraser (skyGain 1.3), the band's backs lifted (lift 0.12, hemi x1.3) [L ok];
  the WHOLE frame is blurred because Act IV's focus is elsewhere [S: act4_r5 `focus` on the party]; the junk pile foreground [S].
Honest: (1) the look only lands on frames whose `focus` is the subject - the three Act IV frames in the sheet are soft everywhere
until act4_r5 sets it (REQUESTS); (2) the two-colour grade reads at thumbnail scale now, but Jade's jacket / the hero skin go a touch
grey-sand under pairAmt 0.85 - if the heroes must stay as painted, lower pairAmt to 0.7 or raise `protectSat`; (3) the tilt band
(`tilt` 0.4) softens the bottom rows: in low wides the heroes' feet / the near ground go soft by design, it looks like a tilt-shift
lens, but a shot with the heroes at the bottom edge wants `tilt: 0.2`; (4) culled columns leave their entablature floating where a
run of standing columns crossed them (visible nowhere in the six frames; possible in wides of the stoa) and GTAO still darkens their
foot; (5) the far hill temples (124.6) are not registered.

## Review outputs
- out/review/look_r5/m1_sheet.jpg (first pass: k08b | k08b + r5 | reference, 7 rows; coordinator: too timid)
- out/review/look_r5/m1_columns_demo.jpg (first pass: the opt-in column cull at 90.375 keep [A5,A6,C88a] and 109.2 keep [R0,R1,A12])
- out/review/look_r5/m1b_sheet.jpg (second pass, same layout) + m1b_<t>_1080p.jpg (the k08b + r5 frames at full size)

## REQUESTS
- battle_r5 asked (their checkpoint) that `look.r5.columns.cull ['M3']` is honoured in the encounter: CONFIRMED. A per-shot `columns`
  REPLACES the range default, so `{ cull: ['M3'] }` culls exactly M3 and nothing else (the stage default `keep: ['R0','R1','C108']`,
  which culls the back colonnade, is then off for that shot); to have both, pass `{ keep: ['R0', 'R1', 'C108'] }` (M3 is not in the
  keep list, so it is culled with the rest) or `{ keep: [...], cull: ['M3'] }` (the same, explicit).
- act4_r5: every Act IV shot needs a `focus` on the subject (the party at 123.354-129.34, the glyph plane at 135.6-143.48, Jade + the
  Eraser's eyes at 143.48-149.22, the party in the swarm wide): Act IV's current looks carry `dof: 0` and a focus that is not the
  subject, so with --r5 the preset's DOF blurs the whole frame there (124.6 / 131.5 / 139.395 in the sheets). `r5Shot({ focus })` or
  `look: { ..., r5: { focus } }`; `dof: 0` per shot if a frame must stay deep.
- act4_r5: the far temples on the hills (124.6) are not in the column registry (templeGeo bakes them with per-column RNG); if they must
  go, pass `zones: [[x, z, r, y0, h]]` per shot, or ask me to register them (one evening of RNG replay).
- talos_r5 / battle_r5: pick your hero columns per shot with `W.r5.columnsInView(camera)` (ids + screen position) and override the
  range default with `columns: { keep: [...] }`; tell me if a culled column was a gameplay anchor (none are, by my reading: the
  registry holds only the prototype colonnade, the gate, mesa B's ruins, the arch, the stoa and compose's framing pieces).
- talos_r5: `LOOK({ k8Beam: 0 })` is honoured now (your round-4 request); the first-person shot no longer needs to hide the mesh.
- coordinator: `R5()` (common.js, talos_r5) and `LOOKCFG.r5` (env.js, mine) read the same `?r5=1`; dedupe if you want one source.
