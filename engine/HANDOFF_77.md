# HANDOFF at t = 77.76 (Team A -> Team B)

77.757 is the bar-47 downbeat, where the hats and snare start the triplet roll. Act II's last scene (`act2.build`, `src/scenes/act2/build.js`) ends at 77.757 exactly. Team B's first entry should start at `T.bar(47)` (= 77.757).

## Rebuild the exact frame: import the set

```js
import { buildLaunchSet, LAUNCH } from '../act2/launch_set.js';
const set = await buildLaunchSet(st, ctx);     // adds ground, 出发 gate, countdown lights, void background to your Stage2D
set.update(t);                                  // the same per-frame animation as Act II (lights, gate shimmer, waterfall)
```

Everything below is in world game-pixels (y up). These are the constants in `LAUNCH` (`src/scenes/act2/launch_set.js`), so read them from there, not from this file, in case they get tuned.

## Camera at 77.757

- Stage2D, **zoom 1**, centre **(192, 90)**. The view covers x 32..352, y 0..180. No shake on the frame. The camera is static for the last bar (76.1-77.757).
- HUD: Lost Vikings bar (`HUD`, 36 px) visible. Jade's portrait sings on her words. `alert` is off (the level was FOUND, i.e. built, in the chorus).
- Subtitle slot: empty at 77.757. The 一切从这里出发 subtitle ends at 75.2.

## Look

- VOID / EDITOR: `BlueprintBG` (black #05060d, grid minor 8 / major 32), plus a few wireframe cube gizmos drifting at parallax 0.4.
- The ground is the FUNCTIONS-coloured level they built in the chorus: grass-top (green) + dirt (brown) 16 px tiles, `LAUNCH.groundTop = 60`, running from x = -208 to x = 432.
- **Important for THE TURN (80.81):** the 2D world at 77.76 is COLOURED (functions applied), but the bible's TALOS world at the turn is UNPAINTED plaster. Team B owns the bridge 77.76-80.81 (for example, the roll's spawned blocks are fixtures/gray, and the turn reveals plaster), so decide there. A doesn't paint anything in the 3D world.

## Party at 77.757 (feet positions, all facing right, standing on the ground, y = 60)

| Hero | x | Anim / strip | Notes |
|---|---|---|---|
| Ricky | `LAUNCH.party.ricky` = 74 | `idle` | guitar ready |
| Charlie | `LAUNCH.party.charlie` = 104 | `idle` (hat on) | |
| Jade | `LAUNCH.party.jade` = 136 | `drum` frame 0, **pencil: true (hair DOWN)** | both pencils in hand: ready for B's triplet-roll drumming |

## Set pieces

- **出发 starting gate:** two rainbow Hanzi2D (size 96, bold 2, style rainbow, shadow #0a1030), fully drawn. 出 at x0 = `LAUNCH.chu.x` = 180, 发 at x0 = `LAUNCH.fa.x` = 262, both y0 = 60 (standing on the ground). They erupted on 出 (73.057) and 发 (73.555) and shimmer (hue shift) after that.
- **Countdown lights:** a lamp post at x = `LAUNCH.lights.x` = 158 (16x34 board on a 2 px post, base on the ground). Three reds light on 75.27, 76.10, 76.93. Act II's last frame (77.733) shows three reds. **GREEN is at 77.757 = B's first frame** (`set.update(t)` shows it automatically). Start the action on that green.
- Free runway between Jade (136) and the gate (180): B's blocks / ramp can go there or anywhere.

## Timing context for B

- 77.757-79.4 triplet roll (`T.cue` it yourself; `snare_rolls_builds[0]` says 77.76-79.4).
- 79.36 一笔一画! chant, `vocal_accent` 79.56, last hit ~79.604.
- 79.87-80.805: total silence (freeze). 80.81 = impact = THE TURN.

## LINES OF CODE counter (added 2026-10-15)

The HUD counter is a running gag now. It counts up with strokes and drawn blocks and jumps on big draws. It reads about 1,863 at 77.757. It's a pure function of time: `import { locAt } from '../../show/loc.js'; hud.set({ loc: locAt(t) })`. Append your act's events to the ACT III-V block in `src/show/loc.js` (`[t0, dur, n, curve]`; n < 0 when something gets erased).
