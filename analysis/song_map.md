# The Vibe Coding Song (一笔一画): song map for shot planning

Source: `inputs/The Vibe Coding song (一笔一画).mp3`. Decoded length is **201.16 s (3:21.16)**; audio runs to about 3:21.2.
Times are seconds on the NLE timeline (first decoded sample = 0). Format below is m:ss.mmm.
Data files: `timing.json` (beat grid, sections, silences, drops, energy per bar) and `lyrics_timed.json` (lines and words with confidence). The energy plot is `energy_plot.png`.

## Read this first

1. **The tempo is not a fixed 140 BPM.** It accelerates smoothly from **140.2 BPM at 0:00 to about 152.3 BPM at 3:01**. A fixed 140 grid would drift about 2 s (5 beats) by the last drop. Use `timing.json → beat_grid.beats`: 488 beats and 122 bars, verified so that 97.9% of 680 strong drum onsets fall within 15 ms of a grid beat, 8th, triplet or 16th (median 2.3 ms).
   - Bars are 4/4 at the 140-level, in a trap half-time feel (kick on 1, snare on 3).
   - The bar length shrinks from 1.71 s to 1.58 s.
   - At 30 fps one beat is about 12.8 frames at the start and 11.8 frames at the end.
2. **There is no key change.** The final chorus and drop 2 use the same harmony as chorus 1 (chroma r = 0.935 at 0 semitones). The "lift" in the final chorus comes from three things:
   - the stop–slam arrangement;
   - higher vocal lines (+2 st on "I think…", +7 st on "And everything goes…");
   - the return from the E minor/G bridge to A.
3. **The performance differs from the lyric sheet:**
   - In the intro, "Paint it, run it, ship it!" comes **before** a breathy 一笔 一画.
   - "I just ask myself…" is sung once per chorus.
   - The in-chorus (一笔一画!) after "need?" is not performed.
   - The bridge couplet is sung twice.
   - The (一笔一画!) chants lead straight into the silences before each drop.
   - Ad-libs not on the sheet: "Oh oh oh" (59.45), "Hey hey hey" (92.56), "Eh eh eh" (112.3), "yeah" (115.6).
4. **The "whistle-like synth hook"** is a pure tone of about 1.2–2.1 kHz. It plays the 4-note 一笔一画 motif in the intro and the call/answer phrases in both drops. Its timings are listed as `hook` entries in `lyrics_timed.json`.

## Section table

Energy is rated 1–10 by ear-equivalent judgment, anchored on the measured section loudness in `timing.json`.

| # | Section | Start – End | Bars | Energy | What the music is doing |
|---|---|---|---|---|---|
| 1 | Intro A | 0:00.000 – 0:07.183 | 1–4 | 3 | Synth pad and sparse kicks; no bass. The first downbeat is a kick at 0:00.343. A 4-note whistle hook plays at 0:00.90–0:03.75. The shouted chant "Paint it, run it, ship it!" (4.21–6.91) lands one word per beat, with drum stabs between the words. |
| 2 | Intro B | 0:07.183 – 0:14.012 | 5–8 | 4 | The 808 enters at 7.01, with a hit on the bar 5 downbeat at 7.18. The second whistle-hook phrase (~1.18 kHz) plays at 7.60–10.62, followed by a whispered 一笔 一画 (11.12–12.86) and a high melisma until 13.82. |
| 3 | Verse 1 | 0:14.012 – 0:34.298 | 9–20 | 5 | The full trap groove kicks in at 14.025, with a sultry low lead. Instruments stop under the voice at 16.73–17.38 and 23.70–24.20, with a re-hit on the next bar line each time. There are stutter cuts at 29.2–30.8. The Mandarin lines start at 27.80. |
| 4 | Pre-Chorus | 0:34.298 – 0:41.028 | 21–24 | 6 | Chopped stops at 35.88–36.89 and accent hits at 35.56 and 36.41. The vocal climbs and is held on 来 (40.1–41.6). |
| 5 | Chorus 1 | 0:41.028 – 1:07.778 | 25–40 | 7 | The belted English hook. A stop at 43.89–44.45 falls under "read". The "Oh oh oh" run is at 59.45–61.25, and "there" is held until about 67.9. |
| 6 | Chorus 1 tag / build | 1:07.778 – 1:20.810 | 41–48 | 7 → 0 | The drums thin out and the synths swell by about 6 dB. Two shouted chants: 一切从这里出发 at 72.13 and 一笔一画 at 79.36. From 77.76 the hats and snare thicken into a triplet roll; the last hit is at about 79.64. **A full silence runs 79.870–80.805 (0.935 s)**, filled only by the 画 vocal tail. |
| 7 | **Post-Chorus Drop 1** | 1:20.810 – 1:34.204 | 49–56 | 9 | **Impact at 80.81.** The drums land an 8th note before the bar 49 downbeat (81.058), and the 808 follows at 80.99. The whistle hook plays at 81.87–86.15. "Fixtures!" peaks at 86.87, followed by a stop at 87.26–87.81. The whistle answers at 88.48–89.88. "Functions!" comes at 89.95, followed by a stop at 90.375–91.085. A "Hey hey hey" pickup comes at 92.56. Accent-hit pairs fall on beat 4 → the next beat 2: 82.30/83.12, 85.59/86.41, 88.88/89.69. |
| 8 | Verse 2 | 1:34.204 – 1:50.450 | 57–66 | 6 | The groove returns and the lead starts on the downbeat at 94.22. 世界 是我的舞台 (107.15) is sung over three stutter stops at 107.6–109.3. |
| 9 | Rap Verse | 1:50.450 – 2:03.354 | 67–74 | 7 | Fast Mandarin rap at about 10 syllables per second. Accent hits fall on beat 4 of bars 67, 69, 71 and 73: 111.66, 114.90, 118.12 and 121.34. Ad-libs: "Eh eh eh" at 112.3 and "yeah" at 115.6. |
| 10 | Bridge (stripped, half-time) | 2:03.354 – 2:16.212 | 75–82 | 4 → 6 | The drums and 808 drop out at 124.5–129.3, leaving only pads and voice. The drums return at about 130 with a half-time feel, and a triplet fill runs 135.0–136.1. The couplet starts at 123.18 and again at 129.36. |
| 11 | Final Chorus | 2:16.212 – 2:41.728 | 83–98 | 8 | The vocal pickup is at 135.60. **The band stops at 137.47–138.90** while the voice continues. A lone hit lands at 138.905, the band **stops again at 139.06–139.70**, then comes the **full slam at 139.70**. A 16th-note snare roll at 160.9–161.7 ends the section. |
| 12 | Final Chorus tag / build | 2:41.728 – 2:54.395 | 99–106 | 8 → 0 | A synth swell, with 一切从这里出发 at 165.87. Dense 8ths start at about 168.1, followed by 一笔一画 at 172.80. The last hit is at 173.02, then **silence at 173.41–174.00 (0.59 s)** with the 画 vocal bridging into the drop. |
| 13 | **Post-Chorus Drop 2** | 2:54.395 – 3:07.039 | 107–114 | 10 | **Impact at 174.395, on the bar 107 downbeat**, with the 808 at 174.62. This is the loudest section. The whistle hook plays at 174.78–179.31. The "Fixtures!" peak at 180.23 rings over a stop at 180.50–181.12. The whistle answers at 181.12–183.10, and "Functions!" comes at 183.07. A stop follows at 183.72–184.27, then a 16th riser at 184.3–187.0. |
| 14 | Outro | 3:07.039 – 3:21.160 | 115–122 | 3 → 6 | No drums: a sustained pad and 808 under a free-time vocal (186.70, "that's it." at 191.30). The nominal beats in bars 115–118 are placeholders. A synth pulse at about 134 BPM starts at 194.06. A tag hit at 197.61 is followed by a micro-silence (197.78–198.03), then the **final drum tag at 198.035** at about 141 BPM. A processed 一笔一画 chop plays at 199.2–200.8, and the sound ends at about 201.2. |

## Lyrics with times

Each line shows its start, its musical position (bar.beat + fraction of a beat) and its confidence. Word-level times are in `lyrics_timed.json`.

**Intro.**
- 0:00.900 [b1.2] (hook) whistle 4-note 一笔一画 motif, until 0:03.750
- 0:04.210 [b3.2] *(Paint it, run it, ship it!)*, until 0:06.910 (medium)
- 0:07.600 [b5.1] (hook) whistle phrase 2, until 0:10.620
- 0:11.120 [b7.2] 一笔 一画 (breathy), until 0:12.860 (medium)

**Verse 1.**
- 0:14.110 [b9.1] Everything I love about life just blossoms (high)
- 0:18.100 [b11.2] because (medium)
- 0:20.120 [b12.3] my imagination is linked to my everyday life (medium)
- 0:27.800 [b17.1] 每一天 都是色彩 (low)
- 0:31.280 [b19.1] 真世界 就画出来 (medium)

**Pre-Chorus.**
- 0:34.690 [b21.1] 说出来 它就存在 (high)
- 0:38.250 [b23.2] 彩色笔 画出未来 (low, ±0.2 s)

**Chorus 1.**
- 0:41.220 [b25.1] I think about stuff I read (high)
- 0:48.620 [b29.3] I just ask myself what it is that I need? (high)
- 0:54.840 [b33.2] That's it, the fixtures and the functions (high)
- 0:59.450 *(Oh, oh, oh, oh, oh)* ad-lib (medium)
- 1:01.300 [b37.1] And everything goes from there, held until about 1:08.1 (high)

**Chorus 1 tag / build.**
- 1:12.130 [b43.3] *(一切从这里出发!)* (high)
- 1:19.360 [b47.4] *(一笔一画!)*, loud at 79.56; 画 rings into the silence (high)

**Drop 1.**
- 1:26.630 [b52.2] *(Fixtures!)*, loud peak at 86.87 (medium)
- 1:29.950 [b54.2] *(Functions!)* (medium)
- 1:32.560 *(Hey, hey, hey)* pickup (medium)

**Verse 2.**
- 1:34.220 [b57.1] Everything I love about life just blossoms (high)
- 1:40.120 [b60.3] because (medium)
- 1:41.000 [b61.1] my imagination is linked to my everyday life (medium)
- 1:47.150 [b64.4] 世界 是我的舞台 (high)

**Rap Verse.**
- 1:50.410 [b66.4] 不用背语法 我只说出想法 (high)
- 1:52.300 *(Eh, eh, eh)* (medium)
- 1:53.820 [b69.1] 一句话 屏幕上就开出花 (medium)
- 1:55.600 *(yeah / eh)* (low)
- 1:56.880 [b70.4] Bug 也不怕 就当草稿再画 (medium)
- 1:59.020 [b72.2] Fixtures 打底 functions 上色 (medium)

**Bridge.**
- 2:03.180 [b74.4] 是一幅画 也是一段代码 (medium)
- 2:05.860 [b76.3] 一笔一画 都是我的回答 (medium)
- 2:09.360 [b78.3] 是一幅画 也是一段代码 (high)
- 2:12.980 [b80.4] 一笔一画 都是我的回答 (medium)

**Final Chorus.**
- 2:15.600 [b82.3] I think about stuff I read; sung over the band stops, with "read" held through the slam at 139.70 (high)
- 2:23.480 [b87.3] I just ask myself what it is that I need? (high)
- 2:29.220 [b91.1] That's it, the fixtures and the functions (high)
- 2:34.260 [b94.2] And everything goes from there (low, ±0.3 s)

**Final Chorus tag / build.**
- 2:45.870 [b101.3] *(一切从这里出发!)* (high)
- 2:52.800 [b105.4] *(一笔一画!)*, loud at 173.21; 画 bridges the silence (high)

**Drop 2.**
- 2:59.760 [b110.2] *(Fixtures!)*, loud peak at 180.23 over the stop (medium)
- 3:03.070 [b112.2] *(Functions!)* (medium)

**Outro.**
- 3:06.700 [b114.4] Everything I love about life just blossoms (high)
- 3:11.300 [b117.2] *(that's it.)*, with "it" at 193.20 (medium)
- 3:19.200 [b121.4] *(一笔一画!)*, a processed/pitched tag (low)

## The 10 strongest sync points for cuts

| # | Time | What happens | Cut idea |
|---|---|---|---|
| 1 | **2:54.395** (174.395) | Drop 2 impact on the bar 107 downbeat, the loudest moment of the song. The 808 follows at 174.62. | Hardest cut or reveal of the video. |
| 2 | **1:20.810** (80.81) | Drop 1 impact, an 8th-note anticipation of the bar 49 downbeat (81.058). | Smash cut on 80.81, not on the bar line. |
| 3 | **1:19.870 – 1:20.805** | A 0.935 s total silence (−64 dBFS), with only the 画 shout tail. | Freeze frame or black; hold for 22 frames at 24 fps. |
| 4 | **2:53.410 – 2:54.000**, last hit 2:53.022 | Pre-drop-2 silence, with the 画 vocal sliding across it. | Cut on the last hit at 173.02, then hold. |
| 5 | **2:19.700** (139.70) | The final-chorus full-band slam, after stops at 137.47–138.90 and 139.06–139.70 and a lone hit at 138.905. | Stop-motion beats on 137.47, 138.905 and 139.70. |
| 6 | **0:14.012** | The verse 1 beat drops (kick at 14.025); "Everything…" starts at 14.11. | First full-energy cut. |
| 7 | **0:07.183**, 808 at 7.01 | The 808 enters on the bar 5 downbeat. | Second intro shot. |
| 8 | **1:17.76 → 1:19.6** | The triplet snare/hat roll accelerates into the cut-out. | Ramp the cut rate (cut every half beat). |
| 9 | **1:26.87 / 3:00.23** | "Fixtures!" shouts landing on instrumental stops (87.26 / 180.50). | Title card or typography hit. |
| 10 | **0:04.21 → 0:06.36** | "Paint / it / run / it / ship / it" lands one word per beat at 4.21, 4.62, 5.06, 5.46, 5.91–6.04 and 6.36. | Six quick cuts, one per word. |

Also worth using:
- **Vocal entrances:** 41.22 (chorus), 94.22 (verse 2, on the downbeat), 110.41 (rap), 123.18 (bridge), 135.60 (final-chorus pickup) and 186.70 (outro voice after the riser).
- **The final drum tag at 198.035**, after a 0.25 s micro-silence.
- **The bridge drum drop-out at 124.5**, for the "stripped" mood.

## First 30 seconds, second by second

| s | What you hear (and the frame-exact cue) |
|---|---|
| 0–1 | The synth pad starts at about 0.1. **The first kick/downbeat is at 0.343 (bar 1).** The first whistle note starts at about 0.90. |
| 1–2 | Whistle notes at about 1.40 and 1.80 (pitch ~2 kHz, with a vibrato glide). Bar 2 starts at 2.05. |
| 2–3 | The 4th whistle note starts at about 2.65 and is held until 3.75. Bar 3 starts at 3.763 with a drum hit. |
| 3–4 | The whistle tail ends at 3.75, leaving a short gap. |
| 4–5 | **"Paint" at 4.21, "it" at 4.62.** The drums drop out between the words, with stabs at about 4.40 and 5.04. |
| 5–6 | **"run" at 5.06, "it" at 5.46**, then a stab at 5.89. Bar 4 starts at 5.47. |
| 6–7 | **"ship" at 5.91–6.04, "it!" at 6.36**, with stabs at 6.32 and 6.75. **The 808 enters at 7.01.** |
| 7–8 | **Bar 5 hit at 7.183** (Intro B). The whistle hook's second phrase starts at 7.60. |
| 8–10 | The whistle melody (D6, ~1.18 kHz) plays over the 808. Bar 6 starts at 8.89. |
| 10–11 | The whistle phrase ends at 10.62. Bar 7 starts at 10.563. |
| 11–12 | A breathy **"一 (11.12) 笔 (11.40)"**. |
| 12–13 | **"一 (11.76) 画 (12.30)"**, held until 12.86. Bar 8 starts at 12.30. |
| 13–14 | A high melisma (F5 → A4) at 12.95–13.82, the riser into the verse. |
| 14–15 | **Beat drop and bar 9 at 14.012** (kick at 14.025). **"Everything" at 14.11.** |
| 15–16 | "I love about life…", with an accent hit at 15.29. |
| 16–17 | "just blossoms". **The instruments stop at 16.73**, leaving the voice alone. |
| 17–18 | **The band re-enters at 17.38–17.40 (bar 11).** Hit at 18.04. |
| 18–20 | **"because" at 18.10**, held until about 19.99. Bar 12 starts at 19.10. |
| 20–21 | **"my" at 20.12** (held). Bar 13 starts at 20.80. |
| 21–23 | "imagination is linked to my…", with an accent hit at 22.06. |
| 23–24 | **The instruments stop at 23.70–24.20**, under "my everyday". |
| 24–25 | **Bar 15 re-hit at 24.18–24.20.** "everyday…" |
| 25–27 | "…life", held to a low D3 at about 27.35. Bar 16 starts at 25.87. |
| 27–28 | **"每一天" starts at about 27.80** (bar 17 at 27.56). |
| 28–30 | "都是色彩". Stutter cuts begin at 29.2, with a hit at 29.66. |
| 30 | Stutter cuts continue (30.06 / 30.58). Bar 19 starts at 30.92. |

## Method and confidence notes

- **Stems:** demucs htdemucs_ft (GPU).
- **Beats:** beat_this half-time pulses plus midpoints, snapped to drum-stem onsets. A cubic smoothing spline is fitted through 395 anchors (residual RMS 4.0 ms).
- **Outro grid:**
  - 187.04–194.06 has no percussive pulse; its beats are flagged as `nominal_rubato`.
  - 194.06 onward is measured from the outro onsets.
- **Lyrics:** five independent sources were combined:
  - faster-whisper large-v3 ASR (en/zh, full and windowed);
  - Whisper teacher-forced likelihood tests that decided chant and ad-lib identity and rejected wrong starts;
  - stable-ts forced alignment;
  - CTC forced alignment (MMS_FA with pinyin);
  - spectrogram and note-onset arbitration for every line.
- **Low-confidence lines:** 每一天 (27.80), 彩色笔 (38.25), the final "And everything…" (154.26), "yeah" (115.6) and the processed outro tag. Expect ±0.2–0.3 s on these; everything else is within about ±0.1 s.
- **Chant start vs. peak:** for shouted chants, `start` is the consonant onset and `vocal_accent` is the loud peak. Cut on the accent.
