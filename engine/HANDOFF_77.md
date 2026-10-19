# HANDOFF at t = 77.76 (Team A -> Team B)

77.757 is the bar-47 downbeat, where the hats and snare start the triplet roll. Act II's last scene (`act2.chorus`, `src/scenes/act2/chorus.js`) ends at 77.757 exactly. Team B's first entry should start at `T.bar(47)` (= 77.757).

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

## Party at 77.757 (feet positions, all facing right, standing on their pressure plates, y = 60) — CHANGED in v6

| Hero | x | Anim / strip | Notes |
|---|---|---|---|
| Ricky | `LAUNCH.party.ricky` = **54** | `idle` | guitar ready |
| Charlie | `LAUNCH.party.charlie` = **96** | `idle` (hat on) | |
| Jade | `LAUNCH.party.jade` = **138** | `drum` frame 0, **pencil: true (hair DOWN)** | both pencils in hand: ready for B's triplet-roll drumming |

(v5 had 74 / 104 / 136; the plates are now 42 px apart so the heroes never overlap.)

## Set pieces

- **Pressure plates (game-design pass):** three recessed plates, one per hero, centred on `LAUNCH.party` x (54 / 96 / 138),
  `LAUNCH.plates.w` = 26 px wide, flush with the ground: their frame sits at y 56..59 and a pressed pad is flush with
  `groundTop` (feet stay at **y = 60**). Pressed (latched, glowing yellow) front to back: 从 72.466 (Jade), 这里 72.656 (Charlie),
  出 73.057 (Ricky, trailing: his plate completes the exit) = `LAUNCH.plates.step`; all three are pressed at 77.757. A dotted wire per plate runs along the grass
  (y 56..58) from the plate to the foot of 出 (x 186), yellow when pressed. `buildLaunchSet` builds them (`set.plates`,
  `set.pressed(t)`); after 77.757 B decides whether they stay lit when the heroes leave them (they are latched by default).
  The `EXIT n/3` label is gone by 74.06.
- **The gate strokes** are drawn one stroke at a time on the frames in `act2/plan.js` `GATE` (+1 LINE OF CODE each);
  both characters are complete long before 77.757 (same look as before).

- **出发 starting gate:** two rainbow Hanzi2D (size 96, bold 2, style rainbow, shadow #0a1030), fully drawn. 出 at x0 = `LAUNCH.chu.x` = 180, 发 at x0 = `LAUNCH.fa.x` = 262, both y0 = 60 (standing on the ground). They erupted on 出 (73.057) and 发 (73.555) and shimmer (hue shift) after that.
- **Countdown lights:** a lamp post at x = `LAUNCH.lights.x` = 158 (16x34 board on a 2 px post, base on the ground). Three reds light on 75.27, 76.10, 76.93. Act II's last frame (77.733) shows three reds. **GREEN is at 77.757 = B's first frame** (`set.update(t)` shows it automatically). Start the action on that green.
- Free runway between Jade (138) and the gate (180): B's blocks / ramp can go there or anywhere.
- Off-screen left of the view (x < 32) the hat-seeded ground has a pit (x -96..-49, floor top 28, a spring) and a tower
  (x -48..-1, top 108) from Act II's build run; the visible ground x 32..432 is unchanged (grass top 60, 4 rows).

## Timing context for B

- 77.757-79.4 triplet roll (`T.cue` it yourself; `snare_rolls_builds[0]` says 77.76-79.4).
- 79.36 一笔一画! chant, `vocal_accent` 79.56, last hit ~79.604.
- 79.87-80.805: total silence (freeze). 80.81 = impact = THE TURN.

## LINES OF CODE counter (Round 2 rule, 2026-10-15)

`locAt(t)` (`src/show/loc.js`) is now exact: +1 on the frame each stroke/block is drawn, +chunk size per generated chunk,
down only when the Eraser rubs graphite. Act II's events are derived from `src/scenes/act2/plan.js` (`act2LocEvents()`),
so read the value, don't hard-code it. It read **902 at 77.757** when this was written (Act I's block is still changing; was ~1,863 in the old gag). Never decrements in Act II.

## REALITY build bar (`src/show/build_bar.js`, owned by Act II)

`import { buildAt, BuildBar } from '../../show/build_bar.js'`. `buildAt(t)` is pure: `{ visible, pct, label, text, dock, stuck, done }`.
At 77.757: visible, **pct 99, stuck: true** (the % blinks red/white (2 Hz), the last 1% of the well blinks yellow, and on every off-beat 8th it glitches: `buildAt(t).glitch` 1..4 = '9?%' / 'ERR' / '99.9%' / '9_%', panel jolts 1-2 px, fill flashes red; at the bar's right
end). 100 (gold) at 79.64, text `100% · LOADING…` from 79.87, `visible: false` from 80.81. The widget: `st.addUI(new
BuildBar(), ZUI.BANNER); bar.update(t)`; panel 216x15 at UI x 52..268, y 164..179 (top of the screen).

## HUD at 77.757

`hud.set({ active: null, slot: null, jadeHair: 'down', loc: locAt(t) })`: no active-hero highlight on the frame (the last
one, Ricky on his plate, ends at 73.955). The hat counter in Charlie's 2nd item slot is gone from 72.125 (Act II only).
