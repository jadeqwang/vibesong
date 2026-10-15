# Veo test for vibesong (2026-10-14), condensed from the test agent's report

## Availability
- `google/veo-3.1` ($0.20/s, no audio) and `google/veo-3.1-fast` ($0.10/s at 1080p) via the unified catalog `/ai/run`. No `@cf/` Veo exists ("No route"), so the prefer-@cf rule doesn't apply.
- Inputs: prompt, `image_input` (FIRST FRAME ONLY, raw base64 — a data: URI fails; gen.py prepare() now strips it), duration 4/6/8 s, aspect 16:9/9:16/1:1, resolution 720p/1080p (no 4K), `generate_audio:false` works.
- No last frame, no reference images, no seed, no negative prompt.
- Output: 24 fps H.264, 1920×1080, 192 frames per 8 s, no audio stream. Relay ~285 s submit→file; sync /ai/run 117 s for 8 s 1080p.

## Spend: $7.41 list (of $15). Errors not billed. Logged in media/genlog.jsonl.

## Test A: photoreal aerial (first frame k13_drop2_photoreal.png), alignment = ORB homography + edge NCC, last vs first
| Clip | Camera | inliers / NCC | Verdict |
|---|---|---|---|
| A1 veo-3.1 1080p 8 s | glides, then tilts up to the horizon | 0.70 / 0.72 | Beautiful, ignores "top-down"; usable as a tilt-up reveal |
| A2 veo-3.1-fast 1080p 8 s | stays top-down, slow pull-back | 0.76 / 0.66 | Best Veo result for the sweep; glyphs rigid |
| A0 veo-3.1-fast 720p 4 s probe | push-in | 0.48 / 0.38 | glyphs read as raised slabs with parallax |
| A3 seedance-2.0 first+last (92% crop) | exact 8% push-in | 0.89 / 0.87 | Best composition lock (lands on a chosen frame) |

## Test B: silent PAPER cutscene, veo-3.1 (Charlie + Ricky, no Jade)
Breathing, a head turn, smiles, dusk light warms, camera static. Pencil look mostly holds; contours get a bit inkier/cleaner by 6–8 s. Trim the first ~20 frames (ease-in duplicates). Good for silent reaction/listening shots.

## Recommendation
| Shot | Model |
|---|---|
| 175.5–176.6 photoreal resolve under the subdivision wave | Seedance 2.0 first+last (registration to engine render) |
| 176.6–179.31 top-down sweep | Veo 3.1 Fast 1080p, 2–3 takes |
| 180.23 FIXTURES! pencil snap | nano-banana-pro graphite redraw of the Veo clip's last used frame |
| 184.3–187.0 dive into 一 | Veo 3.1 Fast (untested) or Seedance 2.0 with a close-up last frame |
| Optional tilt-up world reveal | Veo 3.1 |
| Silent PAPER cutscenes | Veo 3.1 |
| Anything sung / lip-sync | Seedance 2.5 only |

Frame rate: all AI clips are 24 fps; master is 30 fps → conform (motion-interpolated for slow aerials).

Files: media/veo_tests/{A0,A1,A2,A3,B1}_*.mp4, *_sheet.jpg, *_stats.json, overlays, analyze.py, refs/. Specs in media/gen/specs/.
