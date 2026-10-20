# v4.4 · unit v44_spread · outro spread reshoot (186.65-194.9) — STARTED 10:30 CDT 2026-10-19

Jade: "Outro spread: Reshoot again" / "i wish it were as good as the other colored pencil singing scenes".
Owns: engine/src/scenes/act5/spread.js, media/act5/frames/**, spread gen specs/tools. Cap $25.

## State
- Backup: engine/out/bak_v44/v44_spread/spread.js.orig (spread.js as in v4.3, pointer spreadR_v14 at :110).
- Spend: $0 so far. Nothing in flight.

## Steps
1. Diagnosis — in progress
1. **Diagnosis — DONE (10:45).** Frames from full_v4.3.mp4: cards 03 (21.5) / 04 (49.5) / 05 (107.4) / 06 (145.0) vs spread 187.5-193.0
   (scratch grid; sheet for Jade comes with the deliverables). What the cards have that the spread lacks:
   - **Face size.** Cards 03/04/06: Jade's face (hairline-chin) ~200 px of 540 (close-up). Card 05 (3-person stage): ~90 px, Jade CENTRE FOREGROUND,
     the men smaller behind her (depth staging). Spread: ~50 px for all three, seated side by side full-length on the bench; the drawing only
     fills ~70 % of the frame width (vignette on a page), and 191.95-193.55 it pulls back to the whole spread (~25 px faces).
   - **Drawing.** Cards = approved NBP stills (rich shading, big eyes, full hair volume, Jade likeness per canon) animated by Seedance, which keeps
     the drawing. Spread = Veo 3.1 redraw (Veo redraws from frame 0: thinner lines, simpler hair, flat anime face).
   - **Singing / lip sync.** Cards: Seedance 2.5 with the vocal stem as reference audio -> lips per word, plus singer body language
     (pb_specs43 performance prompt). Spread: Veo has no audio input; v14 = eyes closed, small smile, no real singing at all. It reads as
     "three people sitting", not "Jade singing the line".
   - **Motion.** v14 calm (torso 0.57, strum 0.53) after the "frozen"/"demented eyes" rounds; cards 2.4-5x the old motion.
   - **Eyes.** Cards: open, sane, matched (Seedance keeps the still's eyes). Spread v12/v13: Veo sclera-less almonds (cross-eyed); v14: closed.
   - **Light/colour.** Cards have a lit subject (stage cones on 05, screen glow on 04, warm key on 03); spread is an even flat sunset wash.
   - **Layout.** The sketchbook framing itself is fine (page edge, gutter), but the jam is a small vignette inside it; that is what shrinks the figures.
   **Plan:** new card-quality vignette for the right page: same sunset/sea/rainbow-一-bench scene, but a closer, staged composition (Jade centre front,
   singing, knees-up; Charlie flat cap + acoustic image-left, Ricky striped shirt + Strat image-right, a step behind), drawn by NBP from the approved
   card stills (05 v2, 03 v3) + the spread crop as references; composited onto the existing right-page paper (gutter/page edge kept) in the spreadR rect;
   animated with Seedance 2.5 + vocal stem (S0 ~186.45, ~9 s, real-time mapped), upscaled, installed as spreadR_v44 + spread_*_v44 textures.
2. **New still — DONE (10:48).** NBP (nano-banana-pro, $0.1344 each, all logged in genlog, tags v44_spread_still_*):
   a1/a2 (from scratch, 4 refs -> schema allows max 3; then 3 refs) cartoony, Ricky brown hair -> rejected; b1/b2 (edit of card 05), c1/c2 (zoom of the
   spread crop): b1 best composition (knees-up, close) but Jade off-model; c1 OK; b2 too wide, c2 Ricky brown. b1f = face edit with card 05 + 03 heads
   (ref_jadeface.jpg) -> Jade on-model; b1g1 = Charlie edit (young, curly dark hair, beige cap) + tips (still showed) -> **b1g1 chosen**.
   9 NBP calls = $1.21. Files: media/act5/_work/v44/{still_*.png, p_*.txt, ref_*.jpg}.
   NEW tools/cutscenes/pb_spread44_still.py (OSPY): Telea-removes the two lower pencil tips, blanks the old vignette on the right-page crop,
   paper-matches and pastes the new vignette (x 272-1763, y 40-1040 of the 1920x1080 spreadR rect) -> media/act5/_work/v44/rect_g1.png (Seedance first frame).
3. **Seedance takes — DONE, collected 10:52** (all three in media/gen/v44_spread_sd25_*.mp4, 9.04 s 24 fps; no paid job in flight). NEW tools/cutscenes/pb_spread44_specs.py (TAKE VARIANT RES). First frame media/act5/_work/v44/ff_g1.jpg,
   ref audio voc_186.30_9s.mp3 (vocal stem 186.30 + 9 s; vocals 186.5-193.6). clip t = song t - 186.30 + lag.
   Jobs (collect with `$PY tools/gen/gen.py wait <id>` / `collect`, PY=~/Documents/1-music-shipped/moongazing/.venv/bin/python):
   - vibesong/v44_spread_sd25_720p_a1-740663aef0 ($2.08, performance prompt)
   - vibesong/v44_spread_sd25_720p_b1-8099f41f75 ($2.08, bigger + lip-sync-first)
   - vibesong/v44_spread_sd25_480p_b1-8823d28f85 ($0.93)
   Spend so far: NBP $1.21 + these $5.09 = $6.30 of $25.
   Next: check takes (faces/eyes 3x, canon, motion), lip lag, upscale chosen (flux precise), conform to 30 fps FrameSeq spreadR_v44 (1080+540),
   new spread_{full,half}_v44.jpg with the new right page, spread.js pointer + tighter close-up camera.
   First look (sheets in scratch): 720p a1 and b1 keep the page framing (page edge + gutter), Jade sings, all three move; 480p b1 REFRAMED to a
   full-frame close-up of the vignette (no page edges) = a possible "jam fills the frame" layout variant.
## 11:00 safe point
- No engine/src file edited yet (spread.js identical to backup). No gen in flight. Spend $6.30 / $25.
- Next: per-take face/eye sheets (3x), lag measure, pick, flux upscale, conform -> media/act5/frames/spreadR_v44, spread_*_v44.jpg, spread.js switch.
## 11:07 agent stopped (API weekly limit, resets 21:00 CDT); coordinator took over
- Agent had already conformed spreadR_v44a1/b1 (272 frames, 1080+540), spread_{full,half}_spreadR_v44{a1,b1}.jpg, and the spread.js LIVE/CAMV switch (line ~71; backup out/bak_v44/v44_spread/spread.js.agent_stop_1107). node --check OK.
- Coordinator audit of a1: canon passes at 3x (caps up blue/pink through the bun, headphones on neck, dot her left, patch on band), eyes sane across a 16-frame strip.
- Clips via engine/out/review/v44/coord/spread_variant.sh <v14|v44a1|v44b1> <page|hold|fill> -> engine/out/review/v44/v44_spread/spread_<live>_<camv>.mp4 (184-196). Installed: v44a1 + page.
- Not done: lag measurement (rt.lag = 0), flux upscale for the 1080 master (check whether 1080 frames are upscaled before mastering).
