# v4.4 walk unit (v44_walk): restage act3.turn 81.6-86.4 as an engaging WALK

Started 2026-10-19 10:30 CDT. Brief: docs/v44_brief.md. Prior: checkpoints/v43_walk.md.
Owns src/scenes/act3/turn.js, src/core/motion/track.js (additive only). Cuts 81.6 / 86.4 do not move.

## Backups
- out/bak_v44/v44_walk/turn.js.orig, track.js.orig (pre-edit copies, taken 10:30). Restore = copy back.

## Status
- 10:30 started; reading turn.js, cutting the v4.3 section for diagnosis. No source edits yet.

## 1. Diagnosis: why the v4.3 walk (81.6-86.4) is boring
Reference: out/review/v44/v44_walk/walk_v43_ref.mp4 (cut from full_v4.3.mp4 77.5-88; file t + 77.5 = song t);
sheets out/review/v44/v44_walk/diag/v43_sheet.jpg (81.6-86.4 at 5 fps), v43_before.jpg, v43_after.jpg.
- **Music**: 80.81-94.2 is Post-Chorus Drop 1, energy 9/10 (the hardest hit so far), 146 BPM (beat 0.411 s; beats 81.882,
  82.294, 82.706, 83.117 ... 86.408). Whistle hook 81.87-86.15 (notes 81.87 / 82.93 / 84.15 / 85.19 / 85.63), accents
  82.298 / 83.121 / 85.585 / 86.409. It is a swagger moment: the party has just landed in the 3D world. The picture ignores it.
- **Camera**: from 83.0 to 86.4 it is a locked side-on (profile) tracking shot that keeps the trio at the same screen spot and
  size. Only the background scrolls. For 3.4 s the composition doesn't change, there is no reveal, and there is no move with
  intent. 82.3-82.8 shows their backs (the whip's end pose).
- **Composition**: the figures are ~1/3 of the frame height, left of centre, single file and in profile, overlapping each
  other. The bottom third of the frame is the dark side wall of the causeway. The action targets (switches, tree tips) are tiny
  icons at the far right or off frame. Faces are barely readable (profiles, small, Jade often hidden behind Charlie/Ricky).
- **Pacing**: a constant jog (2-3.7 m/s) for the whole shot. The footfalls run at arbitrary cadence (x1.15-1.3 of the model),
  so nothing lands on the beat, and the energy never changes on the accents.
- **Characters**: all three do the same thing (jog right) at the same speed, in a line. Nobody looks at anybody, and nothing
  passes between them. Their actions (flick, throw, chord) are small upper-body layers that read as twitches at 540p.
- **World**: the background is graphite. The green causeway is uniform and nothing reacts to their steps. The chunk risings and
  switch clicks happen far ahead and small.
- **Next shot** (act3.drop r5 at 86.385) shows them abreast from BEHIND, walking away. A FRONT view here is the natural contrast.

## 2. Restage (10:30-10:45)
- track.js (additive): `follow(fn, { ..., beats })` :151 + the beat lock at the end of `_follow` :339 (same `_lockBeats` as move({ beats })).
  With no `beats` nothing changes.
- turn.js: the `(v44 walk)` block after walkZ (~:105-150): **`const WALK_V44 = '...'` = THE ONE-LINE SWITCH** ('orbit' | 'lead' | 'side' | null = v4.3 jog).
  V44 (step-off times, speeds, lanes), V44F (per-variant formation), CAM44 (camera keys), walkPaths44. Also: MO setup branch (`if (WALK_V44)`),
  extra looks/layers (`if (MO?.v44)`), cam44 + puffs44 before `const CH`, the camera override in the fly block (`if (cam44)`), and puffs in P.burst.
- Shared: they land, step off (Jade + Ricky on the 82.294 accent, Charlie on 82.706), walk 1.24-1.68 m/s, EVERY footfall on the beat (log: r=1, phases 0.00-0.01),
  a dust puff per footfall, Jade<->Charlie look exchange 83.2-84.2 (Charlie talks with his hands: mocap 'talk' on the arms), Ricky air-strums on the beats 83.4-84.95
  then looks at Jade, Jade looks down the road 84.5-85.15. Cue times (switches, chunks, hat, whistle flicks) unchanged; the road now builds ahead of them.
- Positions at 86.385 ~x 350-413 (was 561-613); act3.drop r5 is a different location, so the hard cut does not need them to match.
- Helper: out/review/v44/v44_walk/render_variant.sh <v> (sets WALK_V44 and renders 77.5-88; ~1 min each).

## 3. Variants (rendered 10:45; 540p, 77.5-88 with audio; file t + 77.5 = song t) in out/review/v44/v44_walk/
- walk_v43_ref.mp4: v4.3 for comparison (cut from full_v4.3.mp4).
- **walk_v44_lead.mp4 (RECOMMENDED, INSTALLED: WALK_V44 = 'lead', turn.js:115)**: a hero walk into the lens. The camera swoops round from the whip
  to the front and backs up ahead of them, low with a long lens. Jade is at the point of a V, the faces read, and they grow in frame, footfalls on the beat. It's the reverse
  angle of act3.drop's next shot (their backs). Trade-off: the switch / chunk events are behind the camera (you see Ricky's beams and the hat fly out past it).
- walk_v44_orbit.mp4: the camera orbits from behind round to a front 3/4 on their faces (Jade near lane, the far two in echelon), then cranes up
  and to the side at 85.2-86.385 to reveal the road ahead (switches 3/4, the hat ping). More camera motion; the trio overlaps while the camera passes profile.
- walk_v44_side.mp4: the v4.3 side-scroller idea, fixed: low hip-height side dolly, closer, a loose file ~30 apart, the camera lags so they stride across
  the frame. The least change from v4.3.
- Canon check (2-4x crops, diag/orbit_jade_crop.png, lead_jade_crop.png): hair loose with both pencils in her hands (yellow, rainbow tip on the
  blue cap in her right hand, graphite tip in her left), white jacket with an orange chest band and one orange band per upper arm, 1420 patch on her left arm,
  pale-blue chest dot, navy wide-leg pants with orange straps, white sneakers. Same figures as v4.3 (no model changes).
- Seams: 86.42-88 vs v4.3 mean luma diff 2.1 (encode). The 77.5-81.55 diff vs full_v4.3 (mean 1.95, max 5.8 at ~81.1, a brown vs grey causeway wall)
  is section-render vs full-stitch state. Against the v4.3 SECTION render turn_walk_v43.mp4 it's 0.55. Nothing before 81.62 was changed.
- Re-render one: `bash out/review/v44/v44_walk/render_variant.sh lead` (from engine/; it rewrites WALK_V44, so set it back to the pick after).

## Status 10:50: DONE + SAFE. node --check OK on both files; installed = 'lead'; no render running; spend $0. Reported to the coordinator 10:48. Test mp4s deleted (sheets kept in tests/ and diag/).
## Open: the full-stitch 540p will be the real check of 77.5-81.6 (section renders show a brown causeway wall at ~81.1 that the full stitch shows grey; pre-existing, not from this unit). The hat flights to switches 3/4 are now longer (~300 u in 0.3 s) because the party is ~200 u further back; it reads as a fast zip.

## 4. Lead polish (coordinator 10:50: V too tight, Charlie half hidden, Ricky's guitar arm over Jade) — done 10:53
- Backup of the pre-polish turn.js: out/bak_v44/v44_walk/turn.js.v1_lead_1050.
- turn.js V44F.lead (:123-125): a wide V. Lanes are Charlie -24 / Jade +2 / Ricky +24, out to the plaster lips: |z| 24-30 is walkable at y 0 along the risen
  segments and feet reach |z| <= 28.4. Speeds are J 1.5 / C 1.43 / R 1.42 m/s, so both flankers end ~27-30 behind her (x at 86.385: J 406, C 379, R 376).
  Lanes don't cross during the merge (ZOF 0/-7/+7 -> 2/-24/+24). CAM44.lead last keys pulled back slightly (85.2: d 175 fov 31; 86.385: d 152 fov 36) so the wide V fits.
- Result: all three faces and bodies read separately from 84 to 86.385 (diag/lead3_sheet.jpg). Overlaps are screen-space only, with 27+ units of depth between them.
- Canon gate, 3-4x crops (diag/canon_lead.png, diag/canon_left.png), PASS:
  - Hair long and loose, both pencils in her hands. Right: yellow, blue cap, rainbow tip. Left: yellow, pink cap, graphite tip.
  - Headphones around the neck (black, orange-rimmed cups on the collar). Band collar with throat tab.
  - Orange chest band, one orange band per upper arm. 1420 patch (black round) on her LEFT upper arm, on the band.
  - Pale-blue chest dot, black top with a midriff strip. Navy wide-leg pants with orange straps, white sneakers.
- Installed: WALK_V44 = 'lead' (turn.js:115). The orbit and side clips are unchanged and switchable (they use the shared V44 formation, not V44F.lead).
## Status 10:53: SAFE. Refreshed lead = out/review/v44/v44_walk/walk_v44_lead.mp4. Nothing running.
