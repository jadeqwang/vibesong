# Credits audit: which models' output is in the cut (Team D, 2026-10-15)

Method: every media file the show loads (`grep` of engine/src for /media/, /sprites/, VideoClip/FrameSeq/texture loads:
act4/paper.js + montage.js + act4/assets/*.jpg, act5 frames/stills/tex, assets/sprites via core/sprites.js), traced back
through media/genlog.jsonl, media/cutscenes/README.md, assets/sheets/NOTES.md and engine/checkpoints/teamD.md.
Inputs that never appear on screen themselves (first frames, concept keyframes, tests, rejected takes) are excluded.
Acts II–III load no model media (procedural + sprites only).

| Model (official name) | Shots that use its output | Approx. screen time |
|---|---|---|
| **Veo 3.1** (Veo 3.1 + Veo 3.1 Fast) | Act IV bridge 128.18–129.39: Charlie / Ricky play clips (`media/cutscenes/*_play_bridge_1`, Veo 3.1). Act V 176.6–183.87: top-down sweep (`act5_sweep2_a`, Veo 3.1 Fast). Outro 186.65–194.4: the living sketchbook spread (`act5_spreadR`, `act5_spreadF2`, Veo 3.1 Fast) | ~14 s |
| **GPT Image 2.5** | Every pixel / voxel hero sprite strip (Acts I–V: run, jump, abilities, hat props, backs, hang, bun pull; `assets/sprites`, gpt-image-2.5-sunburst per assets/sheets/NOTES.md); the paper Jade turnaround + expression sheets (`paper_jade_turnaround`, `paper_expr_jade`), whose crops are the Act IV montage / paper stills (`act4/assets/jade_laugh.jpg`, `jade_sing_*.jpg`) | most of the video (sprites on screen in nearly every scene) |
| **Nano Banana Pro** | Outro + last screen 186.65–207 (minus 194–198): the sketchbook spread (`spread_v1` + Charlie-alone left-page edit `left_v2`). Act V 180.21–183.30: the FIXTURES graphite redraw (`pencil_v4`). Paper sheet edits on screen in Act IV stills (lineup `lineup.jpg`, Charlie expressions, v9 brows) | ~22 s |
| **Seedance 2.0** | Act V 175.5–176.6: photoreal resolve under the subdivision wave (`act5_resolve2`); 183.87–186.65: the dive into 一 (`act5_dive2_sd`) | ~3.9 s |
| **Seedance 2.5** | Act IV bridge 125.769–128.180: Jade singing card (`fallback_card_480p_portrait_lag0.00.mp4` from `cut_jsing_centre_t2`) | ~2.4 s |

Excluded (not in the cut): OpenAI concept keyframes and nano-banana-pro concepts (keyframes/concepts), the photoreal aerial
stills (inputs to Seedance/Veo only), dive close-up last frames (Seedance inputs), rejected takes (sweep t1, sweep2_b,
dive_t1s, spreadF v1, left_v1, pencil v1–v3), Veo/Seedance tests in media/veo_tests.

**Credit line (Veo first, then by screen time):**
Animation: Opus 5.5 and a supporting cast of Veo 3.1, GPT Image 2.5, Nano Banana Pro, Seedance 2.0 and Seedance 2.5
