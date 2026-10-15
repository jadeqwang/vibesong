# 一笔一画 — Creative Bible (v1)

Working title of the video: **一笔一画 · The Vibe Coding Song**
Format: 16:9 1920×1080 master (+ 1080×1350 / 9:16 social crops later), 30 fps (engine renders at 60 internally for motion blur option).

## The one idea everything hangs on: THE STROKE

一笔一画 (yī bǐ yī huà) — literally "one stroke, one line": the way every Chinese kid learns to write, stroke by stroke, in the correct order. It's also exactly how you vibe code: one sentence at a time, and the world appears.

So in this video **every platform, wall, bridge, and ramp is a real stroke of a real Chinese character**, drawn in correct stroke order (data: Make Me a Hanzi stroke medians/SVGs). 一 is a floor. 丨 is a pillar. 丿 is a slide. 丶 is a stepping stone. When the camera finally pulls back, the level the heroes have been running through *was a character all along*. Every world transition is literally drawn by a stroke. That is the coherence rule: **nothing appears or changes except by a stroke.**

## The two pencils = Fixtures & Functions

Jade wears two pencils in her hair (exactly as in Rewind take two). They are the chorus made literal:
- **Pencil with the pink/orange eraser = FIXTURES** (打底, the base layer). Draws regular **graphite**: static platforms, walls, structure, line art. Graphite gray `#4A4A50` → `#9A9AA2`, with the pink-orange eraser cap `#FF8A5C`.
- **Pencil with the blue eraser = FUNCTIONS** (上色, adds the color). Draws in **every color** (its stroke shifts hue along its length). Makes things *do* things: platforms move, springs bounce, flowers bloom, bugs dance. Blue eraser cap `#4F8BFF`.
- **Co-op puzzles** (Talos Principle / Portal 2 co-op spirit, no portals): obstacles that need two or three heroes at once, solved with their own items: pressure plates, Talos-style connector tripods redirecting Ricky's sound beam into receivers, Charlie's hat weighing a plate (a hat pulled out of the hat), hat-trampoline launches.
- Same pencils double as: microphones (she sings into one, holds the other out to Charlie), drumsticks (snare roll on the blocks she just drew), magic wands (prompting).
- Color script: the drafted world is graphite + paper; color exists only where the blue-eraser pencil has touched, until the rap verse (Fixtures 打底 functions 上色), when the full spectrum floods everything.
- Rhyme with the boss: the redeemed Eraser becomes pink like the fixture pencil's eraser. Erasing is part of the same tool.

## The party (Lost Vikings rules: each has one item that does two+ jobs)

| | Jade | Charlie | Ricky |
|---|---|---|---|
| Real role | vocalist, remade the song in 2026 | wrote it in 2011 (SWE → PM) | lead guitar |
| Look | **Hair rule:** EITHER an updo/bun holding both pencils (one blue eraser cap, one pink/orange eraser cap) OR long, loose and down whenever the pencils are in her hands, never both at once. **Pencils:** always yellow bodies; the blue-eraser pencil has a RAINBOW core (multicolor lead visible at the sharpened tip, like a Koh-i-Noor Magic pencil), the pink/orange-eraser pencil has a plain GRAPHITE core; one BLUE eraser cap, one PINK/ORANGE eraser cap (never matching); in the bun they always cross in an X, never parallel, stuck THROUGH the bun like hair sticks (crossing hidden inside the bun), never lying on top of the hair. **Jacket:** white cropped racer jacket built on `inputs/jacket-base.png` (band collar with snap throat-tab, snap epaulets on the shoulders, zip front) + orange stripes across chest/sleeves; front: ONE small pale-blue dot on the chest; left sleeve: the round "1420 MHz" patch (`inputs/sleeve_patch_1420MHz.png`; real costume artwork + spec in `~/Documents/1-music-shipped/rare-earth-techno-remix/costume/{artwork,spec}`: chest_dot, back_dot_and_lettering); back: a BIG pale-blue dot with the words RARE EARTH under it. Orange headphones, black crop top, navy cargo pants w/ orange straps, chunky white sneakers | curly dark hair, beige flat cap (newsboy), charcoal tee, jeans, brown boots, acoustic guitar on back | short black hair, blue/white vertical-striped shirt sleeves rolled, jeans, white sneakers, natural-wood Strat |
| Item | two pencils | the hat | electric guitar |
| Jobs | draw fixtures / color functions / mic / drumsticks | shield vs falling ink-blots / parachute / trampoline for the others / boomerang / **pulls things out of it** (PM joke: "wears many hats" — he pulls out more hats) | power chord = ranged shot that flips switches across the screen (synced to brass stabs) / sustained note = sound-wave bridge (Talos-style light connector in 3D) |

## Enemies & boss (pacifist game)
- **Bugs**: cute pixel insects (ladybug, beetle, moth, caterpillar, firefly). You never kill them; a **dance battle** turns each into a feature (firefly → lamp, beetle → wheel/moving platform, caterpillar → bridge, moth → glider, ladybug → button). Lyric: *Bug 也不怕 就当草稿再画* — "Not scared of bugs; call it a draft and draw again."
- **THE ERASER** (boss): a huge gray rubber block with a sleepy-grumpy face. In the 8-bit act it is the autoscroll wall chasing from screen-left, rubbing the level out behind them (Kaizo pressure). In the bridge it erases the whole 3D world to blank white. The win is not damage: it's **perspective** (Jade finds the viewpoint where the eraser's own white trails spell 画, so erasing was drawing all along) and **color** (she colors it — it becomes the classic friendly pink eraser and joins the gang vocals).

## The four looks (each is reached by a stroke; never a plain cut between looks)
1. **CARTRIDGE** — SNES-era 16-bit pixel platformer (Lost Vikings energy). Side view, Lost-Vikings-style HUD: 3 portraits + item slots. Starts grayscale-ish (a drafted world) and gains color where Jade's pencils touch. Rendered in our Three.js engine as voxels seen through an orthographic side camera + pixel quantize shader, so it reads as true pixel art.
2. **VOID / EDITOR** — the edge of the world where the levels haven't been written: black with blue blueprint grid, purple-black missing-texture checkerboard, wireframes, "LEVEL NOT FOUND", debug gizmos, lorem ipsum. Vibe coding happens here: spoken words → prompt text → strokes → geometry.
3. **TALOS** — the drop: the side camera swings 90° and the pixel world turns out to be a *slice* of a sunlit 3D world. Voxel heroes with real light, long shadows, sea, stone ruins, cypresses, floating ink-stroke architecture, light/sound connector beams. Golden-hour, cinematic DOF + bloom.
4. **PAPER** — the colored-pencil / engraving hand-drawn look of Rewind/Orbital for singing close-ups ("cutscene portraits") and the stripped bridge. Hand-drawn = the human behind the code.

## Lyrics typography system
- **Hero lyrics are in the world**: platforms made of letters, signs, block text that you run across, characters as architecture, Chinese chant characters slammed with real stroke-order animation.
- **Dialogue-box lyrics** (Lost Vikings between-level banter): portrait + text box, typewriter reveal synced to syllables. Used for verse lines.
- **Subtitles**: whenever Chinese is sung, English subtitle underneath (pixel font in CARTRIDGE, clean humanist sans in TALOS, handwritten in PAPER).
- Front-load big typography in the first 30 s to hook + explain 一笔一画 to people who don't read Chinese.

## Translations (subtitle copy)
- 一笔 一画 — stroke by stroke
- 每一天 都是色彩 — every day is full of color
- 真世界 就画出来 — the real world, I just draw it out
- 说出来 它就存在 — say it out loud, and it exists
- 彩色笔 画出未来 — colored pencils draw the future
- 一切从这里出发 — everything starts from here
- 世界 是我的舞台 — the world is my stage
- 不用背语法 我只说出想法 — no need to memorize syntax, I just say what I'm thinking
- 一句话 屏幕上就开出花 — one sentence and flowers bloom on the screen
- Bug 也不怕 就当草稿再画 — not scared of bugs, call it a draft and draw again
- Fixtures 打底 functions 上色 — fixtures lay the base, functions add the color
- 是一幅画 也是一段代码 — it's a painting, and it's also code
- 一笔一画 都是我的回答 — every stroke is my answer

## Bilingual subtitles (both directions)
Every sung line gets the other language underneath: sung language on top, translation smaller below in a second weight, one subtitle slot. Words built into the world (the *because* bridge, the *linked* chain) are not duplicated in-world; the subtitle carries the translation. No subtitles for ad-libs (oh oh oh, hey hey hey) or the "Fixtures! Functions!" chants. "fixtures"/"functions" stay in English inside Chinese subtitles, as in the song's own Chinese.

| English | 中文 subtitle (Jade-approved unless marked) |
|---|---|
| Paint it, run it, ship it! | 画出来，跑起来，上线！ |
| Everything I love about life just blossoms | 我爱的一切，都在绽放 |
| because | 因为 |
| my imagination is linked to my everyday life | 我的想象，连着我的日常 |
| I think about stuff I read | 我想着读过的东西 |
| I just ask myself what it is that I need? | 问自己：我需要什么？ |
| That's it, the fixtures and the functions | 就是这样，fixtures 和 functions |
| And everything goes from there | 一切从这里出发 |
| (that's it.) | （就这样。） |
