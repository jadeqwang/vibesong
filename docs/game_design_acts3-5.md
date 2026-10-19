# 一笔一画: Game design pass, second half (1:26.4–3:27)

Status: **DECIDED (2026-10-15, late).** Jade delegated the calls; all of the "For Jade to decide" items are taken as recommended. See `docs/decisions.md` (2026-10-15 late) and the section at the end. Mocks: `engine/out/mocks/half2/`. This doc picks up where `game_design_acts1-3.md` (approved) stops: half 1 ends at 86.385, on the frame where Ricky's chord raises the last causeway chunk. Everything here is song time. Measured cues are in `src/scenes/act3/common.js` (CUE), `data/cues.json` (act4, act5) and `analysis/lyrics_timed.json` (word times). Where those disagree with `timing.json`, the measured cue wins: the final-chorus slam is at 139.395, not 139.70, and the drop-2 stops are about 0.4 s early.

The ask: make the second half play like the first, as a real co-op game where every hero's ability is needed and the combo beats any one of them; turn the bug dance into a **turn-based RPG battle that ends with the bugs joining the party**; and make Reality Lv 2 at least as voxel-dense as the concept keyframes.

## What's wrong with the second half now (from `acts3-5_sanity_p2c.jpg`, `act3_v9`, `act4_v7`)

1. **After the turn it stops being a game.** From 86 to 123 there's no goal, no threat and no UI. Things happen *to* the party: the slabs rise on their own, the books fall, the monolith lights up. The only real puzzle is the co-op crossing at 101.
2. **The blob is back, in 3D.** At the slabs, `because`, the stage and the books, the three stand in a row facing camera. Jade does nearly everything alone: the books, the monolith, the giant pencil, the lock, coloring the Eraser.
3. **The bugs come from nowhere and leave in two accents.** They appear at 116.88 and become features at 118.175 / 118.38. Nobody has to do anything, they're flat extruded sprites (cardboard next to the sculpted heroes), and there's no reason they'd join.
4. **The Eraser breaks its own rule.** The audience learned in Act I that color can't be erased (the TIP, the squeak, the flowers hanging on the blank page). The bridge then erases the colored world: "color drains, then geometry."
5. **No rhyme with half 1.** Half 1 built a grammar: the bar, the 99% gag, the plates, the prompt, `!` before every solution. Half 2 uses none of it, so the ending doesn't feel earned.
6. **Density.** The heroes are carved from 48×86 px pixel art, so they come out chibi (head about 1/3 of the height) and the painted shading turns into voxel noise. Charlie's curls cover his face from the side, Jade's hair is a black mass at 3/4, and the bun pencils read as antennae. The bugs are flat extrusions and the Eraser is a box with a face.

**Working, keep:** the turn and the causeway, the co-op crossing (k08b), the stage spotlights (k08), the paint flood, the perspective lock, the drop-2 resolution ladder, and the paper outro.

## The big idea: a pacifist RPG where every boss joins you

Half 1 was a platformer (The Lost Vikings). Half 2 levels up the *genre* along with reality: **Reality Lv 2 plays as a JRPG.** Talos-style exploration first, then a battle, then a final boss, then the ending.

The rule Act I planted ("you can't fight it": the chord at the Eraser, `NOT VERY EFFECTIVE`) becomes the system. **There is no FIGHT command.** You win a battle by fixing the enemy until it wants to join you. The bug battle teaches the system on small enemies (the tutorial boss); the Eraser is the final boss and joins the same way. By the gang vocals the party has grown from 3 to 9, and **every recruit is used later for what it became.**

Two new rules, both readable on screen:

| | **Fixtures** (graphite, the structure) | **Functions** (color, what things do) |
|---|---|---|
| Who threatens it | **The Eraser** rubs out graphite (Act I rule, unchanged) | **Bugs** live in functions: colored things they crawl over **glitch** (flicker to the missing-texture checkerboard from the Act I void) |
| Who fixes it | Jade redraws it | The party **debugs** it: a combo that turns the bug into a feature |
| What happens to the enemy | It joins as **UNDO** (cleans up mistakes) | It joins as the **feature** it was hiding |

So the song's pair (fixtures and functions) is also the game's pair of enemies, and both end up on the team. "It's not a bug, it's a feature" is the battle's punchline.

## The battle system (107.15–123.35)

The 3D world has no HUD (wonder, Talos). **The 2D game's UI comes back only when the game asks something of the party: a battle or a goal.** It's a callback the viewer will feel: the pixel windows from half 1 dropping into the 3D world.

- **Look:** Dragon Quest/Final Fantasy windows in the half-1 HUD palette and pixel font, bottom third only. Party rows use the Lost Vikings portraits from the half-1 HUD. Never covers faces.
- **The message window is the subtitle.** The rap lyric types into it like JRPG battle text (it really is ~10 syllables a second, which is exactly a fast text crawl), with the translation line under it. No second text layer.
- **Command menu:** `FIGHT` is struck through with a tiny `not very effective` (Act I callback). The real commands are the class verbs: `PAINT` · `RUN` · `SHIP`.
- **Enemies have no HP. They have a ♥ meter.** Each party action fills it. When it's full, the bug's name turns yellow (Undertale's "can be spared" color). Damage numbers are replaced by floating `♥+1`, and attacks on the party show `MISS` or `GUARD`.
- **Turns are half-bars.** First half: the enemy acts (the problem). Second half: the party answers (the solution). That's half 1's *problem → beat → solution → payoff* rule, now with turn structure. The acting hero gets the half-1 HUD highlight (lit portrait, item slot flash).
- **Techs (Chrono Trigger):** each bug needs a **dual tech** (two heroes; one can't do it alone). The boss needs the **triple tech**, named **一笔一画**, which fixes two bugs at once: the combo is literally stronger than the parts.
- **The conversion is voxel-native:** the bug's voxels lift off and fly into the slots of its feature model (the "redraw"), with a `BUG → FEATURE` tag. Bugs and features are separate 3D models with matching voxel counts.
- **Camera:** JRPG battle grammar. An arc around the arena on the encounter, over the shoulder on the acting hero, a cut to the target for the effect, a pull-back for the victory pose. One cut per half-bar at most.

### The bug roster

Each bug is a real kind of software bug, shows its problem in the world, is fixed by a different pair, and is used later.

| Bug | Software bug | Its enemy turn (the problem) | Tech | Heroes | Becomes | Used later |
|---|---|---|---|---|---|---|
| **Firefly** | flaky test | blinks off the beat; colored lights it lands on flicker at random | **ON BEAT**: Ricky's three chords give it the tempo, and Charlie drops his hat over it as a lampshade | RUN + SHIP | **lamp** | lights the floating fragments at dusk so Jade can measure (130–135); the cart's headlight |
| **Moth** | crash loop | keeps diving into the stage spotlights and knocking them out, one by one | **UPDRAFT**: Jade colors its wings with the flowers from her one sentence, and Ricky's sustain becomes an updraft (the 未来 verb), so it glides instead of crashing | PAINT + RUN | **glider** | flies Jade up to the Eraser's face (145–147); the cart's wings |
| **Beetle** | infinite loop | rolls in endless circles, grinding glitch rings into the stage floor | **BREAK**: Jade draws a graphite 丨 axle through the loop; Charlie's boomerang hooks the axle and its curve pulls the loop out straight (`break;`) | PAINT + SHIP | **wheel** | gives slow Ricky a ride; the cart's wheels |
| **Caterpillar** | stack overflow | keeps adding segments until it spills off the stage | triple tech | all three | **bridge** | spans the gap between floating fragments in the erased world; the cart's chassis |
| **Ladybug** (boss) | *the* bug: red spots are error dots | flashes its spots, and a glitch wave rolls over the party | triple tech **一笔一画** | all three | **the big red SHIP button** | Charlie presses it to say YES to the recruit, and to launch at 出发 |

Dual techs cover every pair (RUN+SHIP, PAINT+RUN, PAINT+SHIP), then the triple. That's the same escalation as half 1 (solos → duos → full chains), compressed into one battle.

## Beat-by-beat level script

★ = new versus the current build. Everything not marked keeps what's there.

### 86.385–94.20 · Drop 1: "FIXTURES! / FUNCTIONS!" (PAINT → SHIP → RUN) ★
The causeway ends at a gap over the sea. The meadow mesa is across it.
- **86.63–87.26 FIXTURES!** The slabs don't rise on their own anymore: **Jade slashes the air with the graphite pencil and each stroke slams up as a monumental graphite slab** (fixtures = what she draws). Stop 87.26–87.81: freeze. The slabs stand scattered at random angles: a draft, not a bridge.
- **88.48–89.88 (whistle answer, accents 88.86 / 89.68):** **Charlie's boomerang hat tags the slabs in order** with the waypoint pings from the turn (SHIP = the plan). Ricky aims.
- **89.95 FUNCTIONS!** Ricky's chord beam connects the slabs **in Charlie's order** (Talos connectors). Stop 90.375–91.085: freeze with the beam lit. On the 91.11 re-hit the slabs swing into a bridge, and Jade colors each one as they cross (a cypress-style flick), so it's a function now and stays.
- **92.56 hey hey hey:** the three co-op gestures (keep). Combo order PAINT → SHIP → RUN, so it isn't a repeat of the turn's SHIP → RUN.

### 94.22–100.10 · "Everything I love about life just blossoms" (the room 1 remix) ★
The same lyric as 14.01, so it's the same room in 3D: **each hero does their room 1 solo move again in depth.** Jade vaults a plaster block with the martial-arts flip, Ricky lumbers onto it with the short heavy jump, and Charlie bounces off his own hat. Viewers who watched half 1 will get it. The meadow takes color in Jade's wake (keep).
- **Bug plants (new):** a tiny ladybug rides on Charlie's cap; a cypress Jade colored at 82.93 flickers to checkerboard for 3 frames as a firefly crawls over it; a beetle rolls past in a tight circle. Three seconds of screen time total, but when the bugs show up at 107 we've seen them, and we've seen that they glitch color.

### 100.12–100.98 · "because" ★
The stone letters are a gate (keep). Callback gag: Ricky, the one who fell through the graphite `because` in Act I, **tests the stone `e` with one foot** before stepping on it; Charlie has the hat-trampoline ready, just in case. Foreshadow: one letter has a fresh **eraser bite** rubbed out of its corner. The Eraser has been here.

### 101.00–107.13 · "linked": the co-op crossing (keep, k08b)
Pressure plate (Charlie), tripod (Jade), beam (Ricky), hat out of the hat to hold the plate (Charlie). Small addition: **the moth flutters in Ricky's beam and bonks off it twice** (the moth's bug, planted). The bridge stroke stays colored.

### 107.15–110.41 · 世界 是我的舞台: ENCOUNTER ★
- **107.15 世界:** the party steps onto the amphitheater stage. The five bugs that have been tailing them land on the far side. Three `!`s pop over the heroes (half-1 grammar). **The battle transition:** for 4 frames the 3D image breaks into the half-1 pixel grid and swirls (the old 2D game cutting in), then snaps back with the battle camera (bugs on the left, party on the right) and the battle windows slide up.
- **Stutter stops 107.615 / 108.195 / 108.835:** each spotlight that slams onto a hero is that hero's **party intro**: they strike their class pose, and their row pops into the party window: portrait, `JADE · PAINT`, `CHARLIE · SHIP`, `RICKY · RUN`. These are the k08 shots, plus the window.
- **109.14 舞台:** the bugs answer with their own intro, a synchronized glitch dance. The stage floor under them flickers to checkerboard. The enemy window lists five names, each with an empty ♥ meter. Message window: `世界 是我的舞台`.

### 110.41–112.07 · Turn 1, JADE: 不用背语法 我只说出想法 ★
- **Enemy half:** `BUGS cast SYNTAX!` The giant `SYNTAX` / `语法` / `{ ; }` textbooks (the existing domino books) fall toward the party.
- **Jade's half:** her command menu opens, and `SKILLS ▸` cascades into nested windows full of syntax (`for(;;)`, `{ }`, `;`, `语法`). On **不用背语法** they topple like the books. On **我只说出想法** a single text field opens, and she types with her pencils like drumsticks (the Act II gesture): `> let's dance`. **ENTER on the 111.705 accent.** The books land around her, `MISS ×3`. Every bug's ♥ ticks up one, and they start to sway.

### 112.07–113.68 · Turn 2, FIREFLY: ON BEAT (RUN + SHIP) ★
- **Enemy half:** the firefly blinks off the beat, and the spotlight it lands on flickers.
- **112.33 / 112.56 / 112.78 eh eh eh:** Ricky's three chords are a metronome. By the third, its blink is locked to the beat.
- **113.28:** Charlie drops his hat over it as a lampshade: **firefly → lamp.** ♥ full, name yellow, `BUG → FEATURE`. Charlie is hatless (`set({ hat: false })`) until he pulls another.

### 113.68–115.30 · Turn 3, MOTH: UPDRAFT (PAINT + RUN) ★
- **Enemy half:** the moth dives at the spotlights and knocks one out (the stage gets darker).
- **113.82 一句话 屏幕上就开出花:** "one sentence, and flowers bloom on the screen." **The screen is our battle UI:** Jade's one sentence types into the window, and flowers burst out of the window frames and spill onto the stage (this replaces the monolith; its beat moves here). She colors the moth's wings in those flower colors.
- **114.95 accent:** Ricky's sustain rises as an updraft and the moth rides it: **moth → glider.**

### 115.30–116.91 · Turn 4, BEETLE: BREAK (PAINT + SHIP) ★
- **Enemy half (115.30):** the beetle charges in endless circles, grinding glitch rings into the floor around the party.
- **115.6 yeah:** Jade draws a graphite 丨 through the middle of its loop.
- **116.11–116.51:** Charlie (a fresh hat, pulled from the hat) throws the boomerang. It curves around the loop, hooks the axle, and pulls the circle out into a straight line: **beetle → wheel**, rolling off on beat 4.

### 116.88–118.66 · Turn 5, BOSS: Bug 也不怕 就当草稿再画, the triple tech ★
- **Enemy half (116.88 Bug):** the ladybug flashes its red error spots, the caterpillar overflows across the whole stage, and a glitch wave rolls at the party. The party windows corrupt into garbage glyphs.
- **117.23 也不怕 ("not afraid"):** Charlie's hat shield takes the wave (`GUARD`, the Act I crumbs callback), and the three step forward together without flinching.
- **117.65 就当草稿 ("call it a draft"):** banner `TRIPLE TECH · 一笔一画`. **Jade sketches both bugs as graphite drafts** (outline only, on 草 118.02 and 稿 118.28).
- **118.175 accent:** Ricky's chord **runs** the drafts (a sound ring passes through them, and they animate).
- **118.38 strong accent:** Charlie **ships**: two hats drop over them.
- **118.47 / 118.66 再画 ("draw it again"):** they come out redrawn: **caterpillar → bridge, ladybug → the big red button.** All five names yellow.

### 119.02–121.40 · Fixtures 打底 functions 上色: VICTORY = THE PAINT FLOOD
Keep the flood: Jade plants the every-color pencil and the wave races to the horizon. Battle-wise it's the victory fanfare: one small line, `★ VICTORY ★`. ★ The new features ride the wavefront: the wheel rolls along its edge and the glider surfs its crest.

### 121.40–123.35 · THE RECRUIT ★
- **121.405 accent:** the five features line up and look at the party with big eyes. The window, in Dragon Quest's words: `The BUGS look at you longingly. Let them join your party? ▶YES NO`
- **Charlie presses the ladybug button**, which is a button now. That's the YES.
- **121.75–122.95 (one per 8th):** the party row grows from 3 portraits to 8: lamp, glider, wheel, bridge, button. `PARTY 3 → 8`. Band shot with the features in their roles (keep the framing), and the battle UI slides away.

### 123.18–129.34 · Bridge: "THE ERASER draws near!" (rule fixed) ★
- **123.18 是一幅画 也是一段代码:** dusk. The battle music (drums) stops. The Eraser rises over the horizon, mountain-sized, and the window flashes once in red: `THE ERASER draws near!` (the classic DQ line, and an eraser that draws).
- **124.5–129.3 (drums out), the rub. Rule-consistent now:** it rubs out **the graphite**, which is the structure of the plaster world, and nothing else. **Everything colored stays, hanging in the air** over blank paper: the cypresses Jade flicked, the meadow trail, the crossing's bridge stroke, the flood's color skin with nothing under it, the heroes and their 5 features. It's the 16.73 image from Act I (flowers hanging on the blank page), now at world scale. Nobody's HP moves.
- **125.86–129.34:** PAPER cutscene, Jade singing, Charlie and Ricky playing (keep).

### 129.36–136.10 · The erased world: reaching the vantage point (keep, plus recruits)
- The floating colored shards and the Eraser's white trails are the illegible chaos of the script, and now we know why they exist.
- ★ **The firefly lamp lights the shards** in the dusk so Jade can see and measure them (the painter's arm-length pencil, keep).
- Ricky's sound-wave spiral bridge, held while Charlie's trampoline launches Jade the last stretch (keep). ★ The caterpillar bridge spans one gap between shards on the way up.
- Triplet fill (133.105–135.81): she climbs three steps.

### 135.60–143.48 · The perspective lock (keep, re-motivated)
From Jade's eye, **the colored shards they left all over the world** plus the Eraser's own white trails line up into one colossal **画** at the 139.395 slam. Every object Jade colored one at a time in Act III was a piece of this picture, so the hand-coloring rule ("every interaction colors something") pays off here. Erasing was drawing all along. The Eraser stops and stares.

### 143.48–149.22 · "I just ask myself what it is that I need?": the final boss joins ★
The same lyric was the prompt in half 1 (`> level up reality` at 52.62). Here it's the boss's command menu.
- **143.48:** the command window opens for the last time. `FIGHT` is struck through. Jade's text field.
- **144.27–147.36:** she types along the line, and the answer is the twist: **`> an eraser`**. She doesn't need to beat it. She needs it: you can't draw without erasing. **ENTER on "need" (147.36).** (Backups: `> undo`, `> you, on our team`.)
- **The finisher, triple tech once more:** the **moth glider flies Jade up to its face** and she colors it the pink of her pencil's eraser cap (PAINT). **Ricky's chord runs the color** and it smiles (RUN). **Charlie pulls one more hat out of the hat and puts it on the Eraser's head**: the PM giving it a role (SHIP).
- **149.22 "That's it":** `THE ERASER joined the party! Class: UNDO`. Party 8 → 9.

### 149.22–154.24 · "That's it, the fixtures and the functions": the rebuild ★
Jade redraws the fixtures in graphite under the floating color, and each shard snaps back onto its structure. **The pink Eraser follows her and tidies her stray lines**, the first time its power helps. The features haul and light. A bar docks at the top, half-1 style: `REALITY LV2 → LV3 ░░░░ 0%`.

### 154.26–162.81 · "And everything goes from there": all nine in parallel ★
The mirror of 61.30. The gang vocal is the whole party, and every member's ability runs at once in one wide shot: Jade colors, Ricky's rings run what she colors, Charlie's hats seed new chunks, the Eraser cleans, the wheel hauls, the glider flies, the lamp lights, the bridge spans and the button blinks. The bar races 0 → 99%.
- **160.83–161.715 snare roll, "everyone grabs on":** the features click together into **the party cart**: caterpillar chassis, beetle wheels, moth wings, firefly headlight, the ladybug button on the dash. **The bugs became the product we ship.** Everyone piles on, and the pink Eraser rides on the back as the bumper.

### 161.73–173.02 · Final build: 99%, 出发, the speedrun ★
- **The bar sticks at 99%** again. Everyone gets the second time.
- **165.87 一切从这里出发!:** the 出发 gate (keep, full color). **Charlie slams the ladybug button: SHIP IT.** The cart launches through.
- **168.1 dense 8ths, the flash-recap montage as a SPEEDRUN:** one cut per 8th through every look (pixel, void, plaster, paper, color), and in each callback frame the cart blasts through the level. A green split timer counts the video's own time, top right, with gold splits. The bar stays on screen through every cut, the one constant.
- **172.80 一笔一画!:** the four characters slam (keep). On them, **the pink Eraser rubs out the stuck `99`** (it's QA now; the 99% bug was the last bug).
- **173.02 last hit: 100%.** Gold, like 79.64. Silence (173.19–173.58): the pencil-tip close-up (keep), with `100% · LOADING…` as the only motion, like 79.87.

### 174.40–186.70 · Drop 2: REALITY LV 3 (keep, small additions)
- 174.40: the rocket up (keep). Small toast `✓ LEVEL LOADED`, the turn's rule (no big card). The bar shatters away like at 80.815.
- ★ From overhead, **the party's route is the dotted path of a Mario-style world map** along the four strokes, with a little flag at each place they played (the causeway, the crossing, the stage, the vantage). Nine dots on the 一.
- Subdivision → photoreal, FIXTURES!/FUNCTIONS! pencil and color views, the dive (keep).

### 186.70–207 · Outro (keep)
★ Optional, cheap: paper doodles in the spread's margins of the pink Eraser with its cap and the firefly lamp (paperkit drawings, not a regen). The blinking firefly-lamp "living detail" in the last image already exists, and now it means something.

## Combo ledger (second half)

| Time | Room | Combo | Heroes |
|---|---|---|---|
| 86.6 | slabs | draw slabs → tag order → beam connects | PAINT → SHIP → RUN |
| 94.2 | blossoms | room 1 solos, remixed in 3D | each |
| 100.1 | because | stone test + trampoline ready | Ricky, Charlie |
| 101.0 | crossing | plate + tripod + beam + hat-in-hat | all three (keep) |
| 107.2 | encounter | party intro spotlights | each |
| 110.4 | syntax | prompt instead of menu | Jade |
| 112.3 | firefly | ON BEAT | RUN + SHIP |
| 113.8 | moth | UPDRAFT | PAINT + RUN |
| 115.3 | beetle | BREAK | PAINT + SHIP |
| 116.9 | boss | GUARD, then triple tech 一笔一画 | all three |
| 121.4 | recruit | button = YES | Charlie (+5 recruits) |
| 129.4 | vantage | lamp + sound bridge + trampoline + bug bridge | all three + 2 recruits |
| 139.4 | lock | perspective | Jade (+ everyone's colored shards) |
| 143.5 | Eraser | prompt `> an eraser` + glider + pink + run + hat | all three + glider |
| 149.2 | rebuild | redraw + UNDO | Jade + Eraser + recruits |
| 154.3 | gang | all nine in parallel | everyone |
| 160.8 | cart | features assemble | recruits |
| 165.9 | 出发 | button launch | Charlie |
| 172.8 | 99% | Eraser fixes the last bug | Eraser |

## Density: Reality Lv 2 at keyframe level or better

**Measured from the keyframes:** the k08b and k09 heroes are about **64–70 voxels tall** (Charlie in k08b is about 585 px at about 8.5 px a step). Their heads are about **1/5 of the height** (not chibi). Each material is one flat tone with soft AO, the faces are simple voxel features (eyes, two brows, mouth), and the hair is sculpted volume with readable strand grooves. The k09 bugs are about **24–40 voxels long**, with clean shapes: the ladybug dome with spots, the metallic teal beetle, the fluffy moth, the segmented caterpillar.

**Why ours fall short isn't raw count.** Our figures already have 86 rows, but they're carved from 48×86 px pixel art: chibi proportions, painted shading and outlines turned into voxel noise, and front, side and back views that disagree at 3/4. More voxels from the same source would just be finer noise.

**Recommendation: 3D-native models (option 2 from RESUME §2).** Jade's ask settles the open hero question, and hybrid close-up patches won't reach it.
- **Heroes, about 96 voxels tall** (1.4× the keyframes), about 5.5 heads, built in code from part models: rounded boxes, capsules and ellipsoids; a hair shell with strand grooves and a lighter rim; the bun with the pencils stuck **through** it in an X (crossing hidden inside, caps out one side, tips out the other). They're voxelized per part, so **the existing pivots, procedural pose library and `Actor.voxel()` API stay**, and every scene keeps working. Flat palette per material. Jacket details as voxel decals: orange stripes, the small pale-blue chest dot, the 1420 MHz patch, and the big dot + RARE EARTH on the back. Faces: 12–14 voxels wide, Jade's pencil-style likeness (large eyes, high center-parted hairline, heart-shaped face, two slightly different brows).
- **Bugs and features, 40–56 voxels long,** each pair built with the same voxel count so the conversion can fly every voxel to a slot.
- **The Eraser** as a sculpted voxel block (bevels, wear, a crumbly rubbed edge, smudge on its face from Act I) in gray, then pink with a flat cap.
- **New world sets at density-team level:** the battle stage dressing, the erased world (colored skins with no structure under them: this is new geometry, a "shell" pass over the world's colored meshes), the rebuild, and the cart.
- **Gate before any scene uses them:** turntables side by side with k08b/k09 crops at the same framing, plus the canon audit at 3× (memory rules) on every hero.

## What it takes to build

| Unit | Scope | Depends on |
|---|---|---|
| **Models** | 3D-native heroes (replace the carving source in `voxfig.js`, keep the pose API), bugs + features, the Eraser (gray/pink/hat), the cart | — (critical path) |
| **Battle UI** | `src/show/battle_ui.js`, a pure function of `t` like `build_bar.js`: windows, menu, text crawl, ♥ meters, techs banner, turn highlight, roster 3→8→9, the pixel-swirl transition | half-1 HUD art |
| **Act III scenes** | drop (slab roles), verse 2 (room 1 remix, plants, `because` gag), stage + rap → encounter + battle + recruit | Models, Battle UI |
| **Act IV scenes** | the Eraser rule fix (shells), lamp/bridge on the climb, the boss recruit, the rebuild, the gang shot, the cart, the speedrun montage | Models, Battle UI, the shell pass |
| **Bar** | `build_bar.js` LV2 → LV3, the second 99%, the Eraser fix, 100% at 173.02, shatter at 174.40 | Act II owner |
| **Act V** | toast, world-map route + nine dots, optional outro doodles | — |

Order: Models and Battle UI first (in parallel). Then gate them on stills. Then scenes. **Render the battle (107–123.35) as its own review cut before Act IV**, the same way the turn shipped on its own.

Cost: almost all of this is code. Image or video generation is only needed for optional extras. The headphone question below may need a paper re-take. Budget impact is a few dollars at most.

## Decided (Claude, on Jade's delegation, 2026-10-15 late)

All of the items below are YES as written. Also decided: headphones OFF everywhere, with a fix pass on the paper assets that show them; at the bridge Jade puts both pencils through her bun at 123.18 and draws them again at 129.36; and the cart, the speedrun and the outro doodles are in.

The original list:

1. **The battle as written:** RPG UI comes back for the battle; `> let's dance`; the roster; the DQ recruit line; Charlie's button as YES.
2. **The Eraser rule fix:** the bridge erases graphite only, and color floats. This changes Act IV's look from "white page" to "colored shards over a white page." The lock and the k11 frame stay.
3. **`> an eraser`** as the answer to "what do I need?" (backups `> undo` / `> you, on our team`).
4. **The second bar** (`REALITY LV2 → LV3`, 99% again, the Eraser fixes it, 100% at 173.02).
5. **3D-native heroes at ~96 voxels, ~5.5 heads tall** (instead of the current chibi build). This is the long pole.
6. Optional: the speedrun montage; the cart; outro doodles.
7. **Canon flag:** the bridge's PAPER cutscene (125.8) shows Jade with **orange headphones** around her neck, and she's in a bun with pencils while the 3D world has her hair down. The headphones are still an open question (RESUME §2.2). Either the clip gets re-taken or we treat headphones as on.
