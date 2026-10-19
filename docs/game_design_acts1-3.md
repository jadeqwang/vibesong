# 一笔一画: Game design pass, Acts I–III (0:00–1:25)

Status: **approved direction (Jade, 2026-10-15).** Decisions: prompt `> level up reality`; the TIP text stays; hair down at 17.38 (twin-pencil draw). Keyframe mocks: `engine/out/mocks/`. It reworks the 8-bit half of `script.md` (0:00 to the turn, plus the first seconds of 3D) so that it plays like a real co-op game and is fun to watch. Shot times are song seconds (`analysis/lyrics_timed.json`, `data/cues.json`).

## What's wrong with the first draft (from the act1_v3 / act2_v4 / full_v2 sheets)

1. **The party is one blob.** All three run in lockstep, 20 px apart, in nearly every frame from 14 s to 41 s. It reads as one sprite with three heads. Nobody leads, nobody lags, and nobody is ever in danger.
2. **The obstacles don't need them.** The `because` bridge, the `linked` chain and the 未来 stairs happen *to* the party. If you deleted any hero, every room would still work. That is the opposite of The Lost Vikings, where each screen is a lock that takes all three keys.
3. **Charlie and Ricky are passengers.** In Act I, Charlie throws one boomerang (the chain) and Ricky does nothing between the RUN IT title and the chorus "oh oh oh".
4. **The Eraser has no rules,** so viewers can't read the threat. It doesn't surge on the re-hits, nothing explains why it slows on color (Jade's 0:27 note), and it simply vanishes at the void.
5. **Act II has no goal.** "What do I need?" gets no answer that drives the rest of the chorus, and the turn at 80.81 has no in-game reason (Jade's 0:49 note).

## The core rule: PAINT IT · RUN IT · SHIP IT is the party

The hook the song opens with is also the game's grammar. Each hero *is* one verb, so every co-op beat in the video is the same three-step sentence, in this order: **Jade paints it → Ricky runs it → Charlie ships it.** Viewers learn the grammar at 0:04, then watch it get remixed harder and faster until the launch at 79.64. That's the Lost Vikings feeling: the team is a machine, and no one part works alone.

| | **JADE: PAINT** (makes things exist) | **RICKY: RUN** (makes things go) | **CHARLIE: SHIP** (gets everyone and everything there) |
|---|---|---|---|
| Item | two pencils | electric guitar | the hat |
| Abilities | **Draw** (graphite = fixtures: a stroke becomes a floor 一, post 丨, ramp 丿, step 丶) · **Color** (rainbow = functions: a colored thing *does* something, and color can't be erased) · **Erase** (flips the graphite pencil and rubs out a doorway with its pink cap: the same tool as the boss) · **Sing** (her words fall out of a bubble as platforms) · **Drum** (pencil hits spawn blocks) · **Type** (prompts) | **Power chord = click** (a straight-line shot that "clicks" switches, links and ▶ buttons across the screen) · **Slam** (a chord locks a falling word or block into place) · **Sustain** (a held note: rising sound-waves are an **updraft**, and later a light bridge in 3D) · **Rings** (while he plays, colored things *execute*: sound is the runtime) | **Shield** (blocks the Eraser's rubber crumbs) · **Trampoline** (bounces whoever lands on it) · **Boomerang** (curves, so it reaches what a straight chord can't: hooks a chain, fetches an item and brings it back) · **Parachute** (carries all three, even as a dangling chain) · **Pull** (pulls another hat out of the hat; "PMs wear many hats") |
| Limit (why they need each other) | Graphite is a *draft*: the Eraser eats it. She can't power anything. | The guitar is heavy: shortest jump, slowest climber. He must stand still to sustain. | He can't make or power anything. One hat in the air at a time (until he pulls another). |
| Owns this layer of the mix | **the vocal** (she draws on the syllables: 说出来 它就存在) | **synth stabs and accents, held notes** | **hi-hats and snare** (hat → hi-hat; the triplet roll at 77.76 is his solo) |

**Saved for later acts, so they stay fresh there:** Ricky's sound-wave bridge and Talos tripods (1:41 and 2:10) and the hat-on-a-pressure-plate gag (1:41) aren't used in Acts I–II.

## The Eraser: rules a viewer can read

1. **It only erases graphite.** Colored pencil won't erase: everyone who's tried to rub out colored pencil as a kid knows that. In the song's terms, graphite is a draft (fixtures), and color is a function that has shipped. **This is the answer to the 0:27 note.** When the Eraser hits color it squeaks, skids and smears, and rainbow smudge builds up on its face, a tiny foreshadow of Jade coloring it pink at 2:23.
2. **Its speed follows the music.** It creeps through the stops, lunges on every re-hit (17.38, 24.20), and stalls on color.
3. **You can't fight it** (a pacifist game). At 17.38 Ricky fires a power chord at it, and it just blinks (`NOT VERY EFFECTIVE`), which tells the audience the answer will be something other than force.
4. **It stops at the edge of the world.** At 34.30 the party runs off into the VOID. The Eraser skids to the last tile, peers over, and settles in to wait: there's nothing in the void left to erase. That explains why it disappears in Act II, and it sets up its mountain-sized return in the bridge.

## Rules for being exciting to watch (and plausible to play)

- **Problem → beat → solution → payoff.** Show the obstacle first, hold half a beat to a beat (the active hero's HUD portrait reacts, and a `!` or `?` appears), then solve it on the next strong beat. Never let a solution show up before we've seen the problem.
- **Kaizo-tight, but fair.** A stroke appears no more than 4 frames before a foot needs it; the Eraser eats a tile right after a heel leaves it. Jump heights are fixed per hero (Jade highest, Ricky lowest), so a viewer can tell which gaps are scary.
- **Break the blob.** Run in a staggered formation: Jade leads, Charlie is in the middle, Ricky trails nearest the Eraser (heaviest). Spacing breathes from 12 to 40 px, each hero has their own jump arc, and Ricky is always the near-miss.
- **One readable action at a time.** The acting hero gets the Lost Vikings HUD highlight (portrait frame lit, item slot flashes on use). Everyone else keeps moving but doesn't act.
- **Every solution uses a verb we've seen.** The character-select demos are the tutorial: nothing appears later that wasn't demoed there.
- **Escalate:** solos (14–17 s) → duos (because, docs) → full PAINT → RUN → SHIP chains (linked, void, 未来, the chorus, the launch). No two rooms in a row use the same combo.
- **A goal you can see:** from 52.6 s a build bar (`REALITY LV1 → LV2 ▓▓░ 12%`) gives the whole chorus a goal you can watch fill.

## Beat-by-beat level script

★ = new versus the current draft. Everything not marked keeps what is built now.

### 0:00–4.21 · Cold open
Keep. Solo Jade with a bun; the big pencil draws 一笔一画 under her feet. It already teaches *strokes appear just in time*.

### 4.21–7.18 · PAINT IT, RUN IT, SHIP IT = the class tutorial ★
Make the three vignettes **one causal chain**, so the hook literally demonstrates the party grammar:
- **PAINT IT** (4.21 / 4.62): Jade colors the gray 画 room (as now).
- **RUN IT** (5.06 / 5.46): Ricky's chord shockwave crosses the screen and clicks a ▶ switch, and **the colored 画 starts running**: its strokes bob, flowers pop out of it. Color + sound = running code.
- **SHIP IT** (6.16 / 6.42): Charlie drops his hat over the running 画, it swallows it, and he pulls out a **cartridge with 画 on the label**, which clacks into the console. `SHIPPED`.
- Each word's stamp carries its hero's color (rainbow / Ricky blue-white / Charlie beige).

### 7.18–11.12 · Character select = the tutorial ★
The demo loops show exactly the verbs used later, plus a one-word class tag in the corner of each card, under Jade's bios (bios unchanged):
- CHARLIE · **SHIP**: shield → trampoline → boomerang (hooks and returns) → parachute → `???` (a hat out of the hat).
- RICKY · **RUN**: chord clicks a far switch → sustain blows a hat upward on a sound-wave updraft.
- JADE · **PAINT**: graphite draws a 一 → rainbow colors it (it springs) → she flips the pencil and erases a block with the pink cap.

### 11.12–14.01 · PRESS START
Keep. Add the Lost Vikings level card: `LEVEL 1-1 · DRAFT` with `PASSWORD: 一笔一画`.

### 14.01–16.73 · Room 1, "Everything I love about life just blossoms" (solos) ★
World 1-1's first screen: nothing can hurt you here, so it shows personality. Each word tile blooms **colored flowers** under their feet (as now). Three tiny obstacles, one per hero, each in their own style: Jade vaults a crate (martial-arts flip), Ricky lumbers onto it with a short heavy jump (we learn he's the weak jumper), and Charlie bounces off his own hat. This introduces the staggered formation.

### 16.73–17.38 · Stop: THE ERASER ★ (plants the color rule)
The freeze. The Eraser slides in and rubs. The level behind the party vanishes to blank paper, **except the colored flowers, which stay hanging on the blank page.** Hold on that one image: it's the clue. Three `!`s.

### 17.38 · Re-hit: RUN ★
- Jade pulls **both pencils from her bun like twin swords** (martial artist), and her hair drops. From here she can draw, and the hair rule holds: pencils in hand, hair down.
- Ricky fires a chord at the Eraser. It blinks: `NOT VERY EFFECTIVE`. Then they run.

### 18.10–19.99 · Room 2, "because" (duo: SHIP saves RUN) ★
The giant **because** is a graphite bridge, and the Eraser chews it letter by letter behind them. Ricky (slowest) is on the last `e` when it drops. **Charlie spins around, throws the hat down as a trampoline, catches the falling Ricky and bounces him onto the ledge** on the 19.99 downbeat. It's the first real save, and it shows they need each other.

### 20.12–25.42 · Room 3, "my imagination is linked to my everyday life" (first full PAINT → RUN → SHIP) ★
A chasm too wide for anyone.
- **"my imagination"** (20.12–22.40), PAINT: Jade draws a tall graphite 丨 post on the far cliff (a fixture anchor).
- **"is linked"** (22.40–23.57), RUN: the blue underlined `linked` hyperlink hangs limp. Ricky's power chord **clicks it**: it turns visited-purple and the chain shoots across and latches onto Jade's post.
- **"to my everyday"** (23.57–23.70), SHIP: Charlie boomerangs his hat onto the chain and grabs the brim; Jade grabs his hand, Ricky grabs hers, and they swing as a **human chain**: linked, literally.
- **Stop 23.70–24.20:** freeze at the top of the swing, three linked silhouettes against the giant **life** sign.
- **24.20 re-hit:** they let go. Charlie pops the hat into a parachute and the chain of three drifts down, landing on the word **life** at 25.42. Behind them, the Eraser rubs out Jade's graphite post and the chain falls into the pit (graphite = draft).

### 25.42–27.80 · The Eraser surges ★
Crossing cost time, and the Eraser lunges close. It sprays rubber crumbs, and Charlie's **hat-shield** covers the three (it's the `eraser_crumbs` strip). Ricky is half a step from being rubbed out. This is the most danger they've been in.

### 27.55–31.28 · 每一天 都是色彩: the discovery (answers the 0:27 note) ★
- **27.55:** Jade glances back at the colored flowers still floating untouched on the erased page. A thought bubble flashes (🌸 → 💡).
- **27.80 每一天 都是色彩:** she spins and paints the floor **behind** them with the rainbow pencil, one tile per syllable. The Eraser hits the colored tiles: **SQUEAK.** It skids, rubs harder, gets nowhere, and a rainbow smear spreads across its face.
- **29.2–30.8 (stutter cuts):** the stutters *are* the Eraser squeaking on the color: each stutter frame is one squeak, a little more smudge, a sweat drop. The party pulls away.
- A small tip in the HUD for about a bar (Jade: yes): `TIP: COLOR IS HARD TO ERASE`.

### 31.28–34.30 · 真世界 就画出来: drawing the world ahead ★
The floor runs out, and missing-texture checkerboard creeps through the background.
- **31.28 真世界:** Jade draws graphite 一 platforms ahead of their feet, Kaizo-tight. Ricky's short jump can't make one gap, so she colors the 丶 under him and it **becomes a spring** (a function).
- **33.10 画出来:** a graphite wall blocks the path. Jade flips the pencil and **erases a doorway with the pink cap**. This plants the bible's "erasing is part of the same tool".
- **34.30:** they run off the last tile. The Eraser skids to the edge, teeters, peers into the void, and stays put.

### 34.69–38.25 · 说出来 它就存在: falling into the VOID (PAINT → RUN → SHIP) ★
No floor at all. They fall, and **Charlie's parachute catches all three** (Jade and Ricky dangling from his boots).
- **说出来 (say it), PAINT:** Jade sings into her pencil-mic, and the characters fall out of her speech bubble below them, ghosted and not yet solid.
- **它就存在 (it exists), RUN:** on the accent hits 35.56 and 36.41, **Ricky's chord slams each character solid**, with a missing-texture flash. Said → run → it exists.
- **SHIP:** Charlie steers the parachute down from character to character. `LEVEL NOT FOUND` flickers in the HUD.

### 38.25–41.6 · 彩色笔 画出未来: climbing the future while it's drawn (answers the 0:41 note) ★
- **38.25 彩色笔:** Jade raises the rainbow pencil, and 未's first stroke starts *at their feet*.
- **38.6–40.54:** **they jump onto each stroke while it's still being drawn**, chasing the pencil tip up through true stroke order (未: 一 一 丨 丿 乀, then 来). The tip is always one hop ahead, and nobody waits for a finished stroke. Ricky's heavy jump falls short once, and Charlie's trampoline covers the gap.
- **40.54 来 (held to 41.6), RUN + SHIP:** the vocal holds, and **Ricky holds the note with it**, aiming his guitar up. Rising sound-waves make an updraft, Charlie opens the parachute, and all three **ride the updraft** up past the top of 来 (classic Lost Vikings: a glider riding a fan). The camera tilts up with them.

### 41.03–48.62 · Chorus: "I think about stuff I read" (context) ★
The updraft carries them up into a sky of **floating pages**: docs, manuals and forum threads drifting like clouds, which make moving platforms.
- **Each hero grabs a page they'd really read:** Jade a stroke-order copybook page (字帖), Ricky guitar tab, Charlie a product spec. Ricky's tab blows out of reach, and **Charlie's boomerang fetches it back** (duo).
- **Stop 43.89–44.45 under "read":** freeze, all three reading on their pages.
- Each page folds into the HUD as an attachment chip, and the three are **context** for the prompt.

### 48.62–54.84 · "I just ask myself what it is that I need?": the prompt (answers the 0:49 note) ★
The prompt box lands center frame, with the three chips attached (`📎 字帖  📎 tab  📎 spec`). Jade types with her pencils like drumsticks (keep).
- **48.62–51.06**, on the syllables: `// what do I need?`, the sung question as a comment.
- **51.06–52.54**, one word per syllable: `> level up reality` (Jade picked this over the long version: three words, keeps the "next level" pun; backup `> make the next level real`).
- **52.62 "need?" = ENTER.** The reply is `✓ on it`, and a build bar docks at the top of the screen: `REALITY LV1 → LV2 ░░░░ 0%`.

Now the whole chorus has a goal, and the turn has a reason: **at 80.81 the level they asked for loads, and reality levels up: the 3D world is Reality Lv 2.** It also sets up drop 2 (`REALITY LV 3`, photoreal) and the outro, where the last level up is the hand that drew it all.

### 54.84–61.30 · "That's it, the fixtures and the functions" + "oh oh oh"
Keep the graphite sweep → rainbow touch → alive. Add the bar (fixtures +20%, functions +25%). ★ **"oh oh oh" (59.555 / 59.975 / 60.425):** Ricky clicks three switches, and each one **runs a different colored function the party then uses**: (1) a spring (Jade bounces), (2) a lift (Charlie rides it), (3) a door (Ricky walks through). The bar ticks up 5% on each.

### 61.30–67.8 · "And everything goes from there" (held): all three abilities at once ★
The money shot of Act II. As the camera pulls back and the level extends in every direction, the three verbs run **in parallel** instead of in sequence:
- **PAINT:** Jade races ahead, coloring blocks.
- **RUN:** Ricky plays, and **sound rings ripple out from him across the level**. Each colored block a ring touches starts executing (moving, springing, opening). Sound is the runtime.
- **SHIP:** Charlie pulls **hat after hat after hat** out of his hat and throws them far out into the void. Wherever one lands, a new chunk of level grows from it. HUD: `🎩 ×1 → ×99`.
- The bar races: 40 → 70 → 99%.

### 67.8–77.76 · Build: 99% and the 出发 gate ★
- **The bar sticks at 99%** (everyone knows that gag), and it's the tension of the build.
- **72.13 一切从这里出发:** the 出发 gate erupts (keep). In front of it are **three pressure plates, one per hero** (the Lost Vikings rule: the exit opens only when all three are on it). They step on one per chant beat; 出 (73.06) and 发 (73.56) ignite.
- **75.27 / 76.10 / 76.93:** the three red countdown lights (keep). Green at 77.757.

### 77.76–79.64 · The triplet roll: the launch combo ★
All three verbs at once, each locked to its own layer of the mix:
- **Jade:** pencil-drum hits spawn graphite steps (keep).
- **Charlie: it's his solo** (the hats and snare *are* his layer). His hat-trampoline bounces the party higher on every triplet.
- **Ricky:** a rising held note bends the last stroke up into the ramp.
- **79.36 一笔一画!** The four characters slam (keep).
- **79.64, last hit:** they launch together, and **the bar hits 100%**.

### 79.87–80.81 · Silence
Keep: freeze at the apex, then the 2° tilt and the sliver of depth. ★ The only thing that moves is the bar's text: `100% · LOADING…`

### 80.81–86.4 · THE TURN → the next level of reality (first seconds of Act III) ★
- On the impact the 2D HUD **shatters and falls away** with the pixel grid. A small `LEVEL LOADED` toast (Jade: no big REALITY LV 2 card on screen; "Reality Lv 2" is our internal name).
- The party is still mid-air from the launch, so **Charlie's parachute opens** and drifts the three down onto the causeway, which is the old 2D strip continuing as a road. That answers who catches them.
- **Whistle hook 81.87–86.15:** Jade colors cypresses on the hook notes (keep). ★ **Accent pairs 82.30/83.12 and 85.59/86.41:** Ricky's chords click far switches, and each click **raises the next segment of the causeway** out of the plaster (RUN). ★ Charlie boomerangs the hat out to tag the next switch as a waypoint before Ricky shoots it (SHIP: the PM ping).

## Combo ledger (Acts I–II)

| Time | Room | Combo | Heroes |
|---|---|---|---|
| 4.2 | hook | paint → run → ship | all three, title |
| 14.1 | blossoms | solos | each |
| 17.4 | Eraser | chord, no effect | Ricky |
| 19.4 | because | trampoline catch | Charlie saves Ricky |
| 20.1 | linked | draw post → click link → hat hook + human chain + parachute | all three |
| 25.4 | surge | hat shield | Charlie |
| 27.8 | color | color stops the Eraser | Jade |
| 31.3 | draw ahead | draw + spring + erase a door | Jade (Ricky rides the spring) |
| 34.7 | void | sing → chord slam → parachute | all three |
| 38.3 | 未来 | ride strokes as drawn + trampoline + sustain updraft + parachute | all three |
| 41.2 | docs | boomerang fetch | Charlie for Ricky |
| 48.6 | prompt | type with context | Jade (+ everyone's pages) |
| 59.5 | oh oh oh | three clicks → three functions used | Ricky, then each |
| 61.3 | goes from there | paint + run rings + hat seeds **in parallel** | all three |
| 72.1 | 出发 | three plates | all three |
| 77.8 | roll | drum + triplet trampoline + pitch ramp | all three |

## What it takes to build

- **New sprite strips:** `jade_erase` (flip pencil, rub with pink cap); `jade_twin_draw` (pencils out of the bun at 17.38, hair falling); `charlie_parachute_trio` (two dangling); `party_chain_swing` (three hanging hand-to-hand); three reading poses holding pages; `eraser_skid` (squeak/skid, 2–3 frames) + a progressive rainbow-smudge overlay; `eraser_peer` (at the edge). Ricky's click reuses `ricky_power_chord`. Every Jade strip must be checked against the character canon (pencils, hair, jacket).
- **New props:** attachment chips, build bar, three gate plates, a sound-ring shader on 2D sprites, an updraft wave, `NOT VERY EFFECTIVE` / `TIP` text, and the level card with `PASSWORD`.
- **Engine:** per-hero jump constants and formation spacing in `choreo.js` (break the blob); a HUD active-hero highlight; color tiles that block `clipX` erasing in `hanzi2d`/`kaizo.js`.
- **Owners:** 0–77.76 is Team A (`src/scenes/act1/*`, `act2/chorus.js`, `act2/build.js`); 77.76–86.4 is Team B (`act3/turn.js`). The build bar crosses the handoff, so it should be a pure function of `t`, like `locAt`. Suggest putting it in `src/show/build_bar.js`.
- **Unchanged:** the cold open, PRESS START, the fixtures/functions sweep, the 出发 gate and lights, the silence tilt, and the turn itself.

## Decided (Jade, 2026-10-15)

1. Prompt: `> level up reality`. The bar reads `REALITY LV1 → LV2`, and the turn card reads `REALITY LV 2` (drop 2: `REALITY LV 3`).
2. The TIP is shown: `TIP: COLOR IS HARD TO ERASE`.
3. Jade pulls both pencils at 17.38, so her hair is down from there on.

## Round 2 notes (Jade, 2026-10-15)
- TIP wording: `TIP: COLOR IS HARD TO ERASE`.
- No big `REALITY LV 2` card. At most a small `LEVEL LOADED` toast. "Reality Lv 2" is our internal name for the 3D world.
- The voxel density of Reality Lv 2 (the world and the heroes) must match or beat the concept keyframes (`keyframes/concepts/k07_the_turn_plaster.png`, `k08b_coop_crossing.png`).
- LINES OF CODE has to mean something on screen: it counts the strokes and blocks that exist in the level. It goes up on the exact frame a stroke or block is drawn, by +1 per stroke or block and by the chunk size for generated chunks. It goes down only when the Eraser rubs out graphite. Colored lines are locked and never come off. So the counter tells the Eraser story: it drops at 16.73 and stops dropping once Jade colors.
- Sprite requests: `engine/ART_REQUESTS.md` A-2.
