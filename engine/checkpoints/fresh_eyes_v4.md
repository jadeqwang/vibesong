# Fresh-eyes review: full_v4_1080p.mp4 vs the bar table (2026-10-18)

The master I reviewed is `engine/out/master/full_v4_1080p.mp4` (1920x1080, 30 fps, 6090 frames, 203.00 s, file time = song time).
I scored it against the bar table in the approved critique doc ("The bar, and where v3 stands against it",
https://claude.ai/code/artifact/0984950d-2ad1-4a61-98d2-2391de01d28e). I also checked it against docs/script.md, docs/v4_brief.md,
docs/v4_passB_brief.md and memory/jade-character-rules.md.
This was a read-only review: I edited no source files and did no engine renders. Evidence is in `engine/out/review/fresh_eyes_v4/` (36 files, 5.6 MB).

**Verdict:** v4 clears most of the bar. The 2011 frame, one ending, the clean flood, the carved slabs, the big-character type and the front-on 3D faces all land.
One cheap blocker is left: the dedication, the last beat of the video, is fully on screen for only 0.5 s before the file ends.
Most of the should-fix items are about legibility (the glosses are too small and faint for a phone) and a few leftover 3D artifacts.

## Method
- Overview: a 2 fps pass as 14 contact sheets (`sheet2fps_*.jpg`). **Note:** the fps filter put each sheet frame ~0.23 s after its label
  (checked against the frame-exact index). All times below are frame-exact (frame/30) unless I say otherwise.
- Every-frame strips around every cut, transition and hand-off: the 2011 tear 2.8, SHIP→SAVE 6.6, SAVE→START 11.0, title→level 13.9, cards in/out at 20.17/23.77/48.57/50.67,
  the shatter 80.8, card 05 at 107.2, the couplet 123.37, couplet→bridge card 125.8, Ricky 128.2, back to 3D 129.4, the 画 slam 139.4, card 06 at 143.4/146.2, the drop-2 pencil 172.7–174.6,
  terraces→outro 186.8, the sketchbook pull-back 192.2, the rainbow wipe 195.2, the tag/stamp 197.5, and the end 199.8–203.0.
- 1:1 crops of every Jade appearance (paper ×8, 3D ×7, pixel), of all text and glosses, and of the mouths on cards 03, 04 and 06.
- A full-video frame-difference scan at 96x54 (cuts, frozen runs, one-frame outliers), a check of the cuts against the 8th-note grid (timing.json beats),
  a phone simulation (frames downscaled to 400 px wide), and lip sync (mouth crops every 2 frames beside the word times from lyrics_timed.json and the RMS of the demucs vocal stem).

## Bar table scores

| Bar row | Score | Evidence |
|---|---|---|
| **A human story, stated early** (real date, real person, real stakes) | **meets** | 0:00 opens on the graphite 2011 page with Charlie alone, the slate `2011 · a song about product management` and the dedication (ev14). At 6.77 `SAVE FILE FOUND 2011` with Charlie's portrait; the year rolls to 2026 by 10.6. The end caption names Charlie and both years. Only gap: Charlie's name on the save screen is about 10 px tall ("CHARLIE" under the portrait). |
| **One strict visual rule, broken once, on the emotional turn** | **close** | The break works: graphite/plaster up to 119, one full-spectrum flood 119.0–123.35 with zero UI, a grey dusk drain in the bridge (129.4–139.4), and color back on the 画 slam at 139.40 (ev18). But strong color still leaks in before the flood: the rainbow PAINT/RUN 画 (4.4–6.7), the saturated navy/gold SAVE screen (6.8–11.0), the 未来 staircase (38–41), the magenta receiver disc (91.4–92.6), the red carpet (93.0–94.2), and the colored band spotlights (107.6–110.4). Most fall under the "what she just drew" exemption, but together they take some edge off the flood. |
| **World in motion by 0:05, title by ~0:08; never open on a frozen frame** | **close** | The pencil moves at frame 0, but from 0.6 to 2.9 s the page is nearly still (mean frame difference 0.15–0.2, against 2.7 while the pencil moves). The 一笔一画 title + pinyin tears in at 3.1–3.2 s, which is good. The English title "The Vibe Coding Song (一笔一画)" shows only 12.95–13.93, in a small box. The 0:14 title/lyric collision is fixed. |
| **Lyrics act out their meaning, one word per beat, size hierarchy** | **meets** | 2D is still strong (blossoms floor, because, linked chain, life, 说出来, 来, 出发). In 3D, FIXTURES/FUNCTIONS are carved into the slabs on both drops (87.0, 90.0, 180.5, 183.6). 绽 is drawn stroke by stroke 94.2–100. The 舞台 split, 答, the couplet split and the `> you are my friend` prompt all read. |
| **One huge character with a small gloss** | **close** | The devices are all there (绽 94.2, 舞台 109.1–110.4, 答 126–128.2, couplet 123.37–125.8), but the glosses fail on a phone. At 1080p the 绽 gloss is ~22 px x-height, grey on grey (ev05). At 400 px every gloss, and the Chinese line of every subtitle, is ~4 px (ev04). 舞台 is up for only 1.3 s and 台 sits clipped at the right edge. |
| **Details that reward a pause** | **meets** | The 2011 room (string lights, laptop), the save-year roll, `"fixtures & functions"` on the save file, the `[spec] [字帖] [tab]` chips, the `// and it's also code` code-comment glosses, the 1420 MHz patch on the paper cards, and the credits in the page margin. |
| **A human-scale release after the climax, then a dedication** | **close** (blocker fix) | One ending, done right: bench page 186.9 → pull back to the sketchbook 192.3 → the 2011 page → a rainbow wipe to the three of them 195.6 → SAVE COMPLETE stamp on the tag 198.1 → credits. But the dedication types on 201.4–202.47, in silence after the audio ends (201.2), and the file ends at 203.0. **Fully legible for 0.5 s** (ev01). |
| **Nothing reads as obviously AI-generated; faces match the pencil-portrait bar or stay hidden** | **close** | The paper cards and outro pages pass and are on-model. 3D faces are now shown front-on (101, 107.6–110.4, 121.5–123, 142.8, 151, 155.5–156.5, 180–184), and they're stylized, not uncanny. Against it: the rap close-ups (112.3–116.9) smear Jade's face, with a purple voxel blob covering it at 114.33–114.47 (ev13). Motion-blur streaks at 91.4–94.2 look like a render artifact (ev03). The terraces hold up at 1:1. |

## Findings, ranked

### Blocker
1. **The dedication is cut off by the end of the file.** 201.4–203.0 (ev01). `For every partial project in a drawer.` finishes typing at 202.47, and the picture ends at 203.0. So the line the video is dedicated to is fully readable for 0.5 s, and it's typed in silence after the song ends. **Owner:** open_close (act5/spread.js). **Fix:** start the dedication on the tag (~198.1, with the stamp) or with the first credit line, so it's complete by ~200.5. If the 203 cap can move, hold the finished page silent for 3–4 s (the script asked for ~6 s, ending ~207).

### Should-fix
2. **Card 05 ("band on a stage") is a 12-frame flash.** 107.233–107.600 (0.37 s; ev02, ev19). The paper still reads as a glitch or a subliminal frame, not a shot. Jade's mouth is a closed smile while 世界 is sung. Her hair also flips from bun + pencils (card) to long and loose (3D) 0.4 s later. **Owner:** stage_3d with paper. **Fix:** hold the card for the whole first stutter stop (107.15–107.71, "世界"), or cut it and let the 3D stage shot carry it.
3. **Motion-blur streak artifacts and a stray color pop in drop 1.** 91.4–92.6: diagonal white streaks across the magenta receiver close-up. 93.0–94.2: the red carpet smears into diagonal dashes, and a small red rectangle sits on the floor by the disc (ev03). These are the "92.0 magenta glow / 93.8 red dash" items RESUME left open. **Owner:** stage_3d (shot) / core (mblur 8, shutter 0.33). **Fix:** lower the shutter for these two shots or drop mblur on them, remove the red dash, and tone the magenta down to the beam color.
4. **The glosses and the Chinese subtitle line are illegible on a phone.** All type glosses: 绽 94–100 (grey on grey, ~22 px x-height), "the world is my stage" 109.1–110.4, "every stroke is my answer" 126–129.4, "it's a painting," / "// and it's also code" 123.4–125.8. Also the second (Chinese) line of every subtitle bar, and every line on the paper cards. At 400 px they come out 4–5 px (ev04, ev05). **Owner:** type. **Fix:** set gloss x-height to at least 34 px at 1080p with a soft paper or dark backing for contrast, and the subtitle CJK line to at least 30 px. Keep the gloss inside the safe area (台 at 110.0 is clipped at the right edge).
5. **The 3D Jade model has no 1420 MHz patch.** The left sleeve band is bare in every 3D close-up: 101.0, 108.5, 142.9, 151.0, 155.8, 180.6 (ev07, ev08). Paper card 06 (143.4–146.2) has the patch above the orange band, not on it (ev09). **Owner:** stage_3d (core/heromodels) for 3D; paper for card 06. **Fix:** add a small b/w round patch centred on the left orange sleeve band of the native model. On card 06, a masked composite the way the brows were done.
6. **The rap / bug battle is hard to read.** 112.3–116.9 (ev13, sheet 07). It's extreme close-ups, heavy DOF, and a purple voxel bug covering Jade's face (114.33–114.47), with the face smeared to a pink blur. A first-time viewer can't tell that bugs are turning into features until 117. **Owner:** stage_3d. **Fix:** make one of the three shots a medium-wide that shows a bug turning into a feature, and keep Jade's face clear of the bug mesh (or cap the DOF).
7. **The opening page sits nearly still for 2.3 s.** 0.6–2.9 (ev14). After the pencil leaves the frame the page barely moves before the tear at 3.1. The bar says "never open on a frozen frame". **Owner:** open_close. **Fix:** a slow push-in, or have the slate/dedication hand-letter itself in 0.6–2.0, or keep the pencil tip hovering and drawing a string-light bulb or two.
8. **A ghost of the flood subtitle is baked into the couplet's paper half.** 123.37–~123.45 (ev06). "Fixtures 打底 … / fixtures lay the base, f…" shows as a sketched pill on the left page. The flood line itself never gets a translation, because of the zero-UI rule, so the song's thesis line goes unglossed. **Owner:** type (couplet source frame) / color. **Fix:** build the paper half from a frame without the subtitle. Optionally write the flood line as in-world type on the 3D gang shot at 121.5–123.3, or as a gloss on the couplet page.
9. **The chorus-2 subtitle comes in early.** "And everything goes from there" shows from ~154.7 while the "oh" ad-lib runs to 155.45; "And" is sung at 155.90. **Owner:** type. **Fix:** start line 41's bar at ~155.8, or give the ad-lib a "(oh…)" bar the way chorus 1 handles it.
10. **3D Jade's skin reads darker and more orange than her paper self under the sunset grade.** 142.7–143.37 (the cut straight into card 06 makes the jump obvious), 151.0, 155.8 (ev08). **Owner:** color. **Fix:** a skin-hue exemption or a lift on the hero mask in the time-keyed grade for 141–162.

### Nice-to-have
11. **The end-page pencil pops in.** 200.87–200.93 (ev15). A lone vertical pencil fades in over 3 frames and then stands still, propped on nothing. **Owner:** open_close. **Fix:** let it roll in and settle (the script's "pencil rolling to a stop"), or drop it.
12. **The REALITY bar flickers.** One red frame at 78.80, and the bar blanks for 2 frames at 79.20–79.23 (ev17). **Owner:** core (build_bar.js) / stage_3d (hud2d). Fine if it's a deliberate glitch gag; otherwise hold the bar steady.
13. **The photoreal terraces never show all four characters at once.** 176.3–184.3 (ev16). The voxel aerial at 175.3 has all four, but the photoreal sweep always clips 画 or the first 一. **Owner:** stage_3d (aerial). **Fix:** hold a slightly wider top-down for ~1 s at 176.6 before the sweep.
14. **The SAVE FILE screen is still a 4.3 s menu.** 6.77–11.03. The year roll gives it purpose. The critique asked for "one beat"; if the intro feels long, trim it to the 808 bar plus the roll. **Owner:** open_close.
15. **Leftover RPG/HUD text in verse 1.** "NOT VERY EFFECTIVE..." 17.4–18.4 and "TIP: COLOR IS HARD TO ERASE" 29.2–30.8 sit beside the lyric bar: two text layers outside the main gags. **Owner:** act1.
16. **Chorus 1 is still staged small.** 41–67.8: tiny sprites on the black void, with an idle 0.8 s at 58.6–59.4 before "Oh oh oh". **Owner:** core (act2/chorus). Optional: one tighter framing on 54.8 ("That's it…").
17. **Off-grid cuts and flashes.** Of 78 detected cuts, 68 are within a frame of the 8th grid. Off by more than 34 ms: 13.033 (86 ms; on a 16th), 44.833, 82.333, 112.333, 116.867, 117.667, 121.4, 133.133 (72 ms), plus 154.267 and 160.833 (on 16ths). One-frame hit flashes off the grid: 52.633 (94 ms) and 117.233 (84 ms). **Owner:** stage_3d / core.
18. **Drop-1 keywords play beside the backs of heads.** FIXTURES 87.0–87.5 and FUNCTIONS 90.0–91.0 show Jade and Charlie from behind. The words are carved on the slabs, so the rule mostly holds; drop 2 (180.5, 183.6) does it front-on and is much better. **Owner:** stage_3d.
19. **The first frame is a quiet thumbnail.** At 1080p the slate is ~30 px x-height and readable; at 400 px it's 5–6 px. This follows the Pass B decision (dedication readable on frame 0); the separate launch thumbnail covers YouTube/X. **Owner:** open_close.

## Lip sync on the paper cards (ev10–ev12)
- **Card 03, 0:20 (20.167–23.767): plausible.** The mouth closes for "my" (21.23–21.37) and for the m in "imagination" (21.70–21.83), and opens wide on "-cause" (20.97–21.10). The "linked" vowel shape at 23.43–23.50 is rounded, not spread. A rough mouth-area vs vocal-RMS correlation peaks with the picture ~0.2 s ahead, but the fit is weak (r 0.33), so Jade's by-ear +6 pick should stand.
- **Card 04, 0:48 (48.567–50.667): good.** It opens on "ask" (49.43–49.57), closes for "my" (49.63–49.83), and the correlation peaks at 0 to −1 frame (r 0.55–0.60).
- **Card 05, 1:47: not lip-syncable.** It's a 0.37 s still-like flash with a closed smile while "世界" is sung (finding 2).
- **Card 06, 2:23 (143.40–146.20): good.** It closes for "my-" (144.47–144.53) and opens on "what" (145.40). The first frame (143.40) is already open before "I" (143.48), which is negligible.

## Character canon (crops in ev08, ev09)
- **Paper** (cards 03/04/06, bridge polaroid, outro bench, end page): pencils cross in an X through the bun, blue and pink caps up, tips pointing down. Headphones around the neck with orange rims. Cropped white racer jacket with orange bands. Baggy navy pants with orange straps (outro). Brows and forehead match the approved v11 look. Card 06 has long loose hair with the rainbow pencil in her hand, which the canon allows; its patch sits above the band (finding 5).
- **3D:** long loose hair with pencils held in hand, which is allowed; headphones on the collar; straps and baggy navy pants all correct. **Patch missing** (finding 5). The hair flips between paper bun and 3D loose at 107.2→107.6 (finding 2).
- **Pixel sprites:** the bun with blue + orange caps reads at sprite scale, with no tip pixels in front of the hairline (15.5 crop).

## Verification results
- **Luma / black frames:** none. Every YAVG drop over 35 falls on a cut or a deliberate one-frame hit flash. The v3 black frames (123.63, 140.20, 140.33, 150.60) and the 0:36 washout are gone.
- **Frozen frames:** the only still runs of 0.4 s or more are the intended stop at 43.93–44.47, 56.53–57.10 and 58.60–59.37 (chorus 1, borderline idle), and the end page 196.97–203.0, which is alive only through the typing and the pencil fade.
- **UI budget:** the flood (119.0–123.35) and the 画 slam (139.40–143.36) are clean. Drops 1 and 2 have no HUD; LOADING appears only in the pre-drop silence (173.1–174.4). The final chorus shows only the PARTY 8→9 strip (149.2–150.9). The speedrun timer, LINES OF CODE, the RPG party menu and VICTORY are all gone.
- **Subtitles:** one bar style plus its pixel twin, as designed. Type lines carry no bar. Timing problem at chorus 2 (finding 9).
- **Seams and hand-offs:** clean at all 23 hand-offs I stripped. They're hard cuts on hits, a paper tear at 3.1, the shatter at 80.8–81.6, and a rainbow wipe at 186.8 and 195.6. I found no halos, z-fighting or white flashes outside hits.

## Evidence index (`engine/out/review/fresh_eyes_v4/`)
ev01 ending/dedication · ev02 card 05 flash · ev03 mblur streaks 92.2/93.9 + face 114.0 · ev04 phone 400 px sim · ev05 1:1 text crops ·
ev06 couplet ghost subtitle · ev07 3D patch missing · ev08 3D canon crops · ev09 paper canon crops · ev10–12 lip strips (cards 03/04/06) ·
ev13 rap face blob · ev14 opening page → tear · ev15 end pencil fade-in · ev16 terrace framing · ev17 REALITY bar flicker ·
ev18 bridge / slam / card-06 strips · ev19 shatter + card 05 strips · ev20 one-frame flashes · sheet2fps_00..13 (2 fps overview; frames ~0.23 s after their labels).
