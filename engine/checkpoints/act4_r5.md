# act4_r5 checkpoint (round 5, 2026-10-17): 123.354-173.02 re-staged per docs/game_design_half2_r5.md, behind `--r5`

## >>> STATE (cold resume) <<<
M2 APPROVED by the coordinator for the half2_v4 stitch (one narrow fix, done below: the sun disc off the 画; verified on stills
out/review/act4_r5/m2b_139.6.png + m2b_124.6.png, no section re-render). Stay reachable for the stitch seams 123.354 / 173.02.
M2 DONE (2026-10-17 ~11:40): out/review/act4_r5/m2.mp4 (123.354-173.02, 960x540, audio, 1488 frames,
--look k08b --r5, look_r5's strong preset live), m2_sheet.jpg (34 frames at 1.5 s), m2_lipsync_paper.jpg, m2_lipsync_3d.jpg,
m2_jade_canon.jpg. Coordinator's five M1 fixes + the focus addendum are in. Waiting for notes. Nothing running; scratch cleaned.
M1 code written Code written behind `--r5` (R5() from src/scenes/act3/common.js, added by talos_r5; I added the `--r5` pass-through
to render.js: page URL gets `?r5=1`; the coordinator dedupes if talos_r5 adds one too). Default renders (no --r5) must stay
byte-identical: A/B stills at 139.4 / 157.0 in out/dev/act4_r5/ab/ (pre_* rendered before the first edit; post_* after; diff below).
Backups (before the first edit): out/bak_r5/act4_r5/ (act4/*.js, build_bar.js, common.js, render.js).
Scratch renders: out/dev/act4_r5/ (delete when done). Review: out/review/act4_r5/.
Render flags: `--fig native --figscale 1.3 --figres 2.5 --look k08b --r5 --workers 1`, `export TMPDIR=$PWD/out/dev/tmp`.

## Files touched (all r5-gated with `const r5 = R5()`; `(act4 r5)` markers)
- src/scenes/act4/main3d.js: cues K.lineFC / K.type5 / K.enter5 / K.cutEyes; the rise camera (low, silhouette); the Eraser's busy
  rubbing + stop-and-stare on the slam; the no-cut lock move (OS5 -> E); Jade's lip sync (lines 36-37) via the native rig's face;
  the world text field `> you` (makeWorldField / fieldState); the recruit cameras F1 (profile two-shot) + F2 (the eyes);
  Jade's hesitation + y/o/u flicks; the swarm lanes GANG5 + CHUNKS + ONE wide shot; cart suspension + dust; look (tilt-shift
  DOF on the lock, dusk fill).
- src/scenes/act4/world4.js: cream paper + eraser crumbs (InstancedMesh, seeded) under r5; `crumbs` exported.
- src/scenes/act4/glyph.js: patchPaperGround(mat, field, extra, { r5 }) injects the pencil grid / smudges / dust GLSL only with r5
  (the default shader string is unchanged; cache key suffix `_r5`).
- render.js: `--r5` -> `?r5=1` on the page URL (+ a usage line).
- NOT touched: build_bar.js (BAR2 already docks at 0% on 149.22), battle_ui.js (battle_r5), creatures, hud2d, montage, paper, overlay.

## Timings used (measured cues win; data/cues.json act4, Team C 2026-10-14)
The design doc's lock times (stop 1 137.47-138.90, lone 138.905, stop 2 139.06-139.395) are timing.json's, ~0.3 s late (cues.json
_doc). Re-measured today from the mp3 (5 ms RMS): band cut ~137.03-137.1, hits 137.41 / 137.85, silence 138.1-138.55, the lone hit
138.595 (+ a short phrase to 139.0), gap 139.05-139.2, pickup 139.25, SLAM onset 139.40-139.42 (stems: 139.395). So:
- lock shot starts 135.60 (line 38 start; the climb shot cuts there, not at 136.212) and holds u = 0 through the band stop;
- the whip starts on the lone hit 138.595 (ease in-out to u = 0.86 by 138.95); "almost" 138.95-139.395; slam 139.395 = E exactly;
- `> you`: y / o / u on the 16ths from the "need?" beat 147.394 (147.394 / 147.494 / 147.594), ENTER 147.693, cut to the eyes
  147.76 (2 frames after ENTER, so the key flash reads), PAINT 148.191 as before.

## REQUESTS
### To battle_r5 (src/show/battle_ui.js, the final-boss window 143.48-154.24) -- exact
With --r5 (read R5() from act3/common.js), in the 'final' phase:
1. 143.48: the command window opens as now (FIGHT struck through + 'not very effective' blinking, cursor on PAINT by 143.75),
   and closes at 144.0 as now.
2. The 2D text field must NOT draw at all (CMDS[last].field): the prompt lives IN THE WORLD (act4 main3d.js makeWorldField).
   Keys / ENTER timings for anything you key off: y 147.394, o 147.494, u 147.594, ENTER 147.693 (was 147.358). Text: `> you`.
3. The party window (PARTY 8, the portraits) collapses to NOTHING for 143.48-149.22 (draw no party window / no roster).
   On 149.22 (the join) it may pop back for the 8 -> 9 moment (THE ERASER added, class UNDO) until 150.6, then collapse again
   (the rebuild's bar + Jade's face need the frame).
4. The message window stays, slimmed to the lyric strip where possible: keep 'THE ERASER looms over the page.' (143.48, red);
   move "You can't draw without erasing." from 147.358 to 147.693 (ENTER); keep 'GLIDER lifts JADE up!' 147.793, PAINT 148.191,
   RUN 148.59, SHIP 148.989, 'THE ERASER joined the party! Class: UNDO' (149.22, gold).
5. The ♥ window for THE ERASER (drawEraserWin, enemyIn 147.6): fine to keep; please anchor it top-right, never over the
   world text field (frame centre) or the Eraser's face (upper right third in F1 143.48-147.76, full frame in F2 147.76-148.19).
6. The 123.354 hand-over: I keep HANDOVER_CAM = { pos (1380, 52, 610), tgt (1350, GY + 26, 430), fov 52 } (rap.js's last camera).
   If your 123.18-123.354 re-stage changes the last camera / fov, tell me the new values and I match them (the r5 rise camera
   starts from HANDOVER_CAM and drops to chest height behind the band).
### To look_r5
- FYI the DOF depth bug above (lookFrom's P45 vs camera.near): any legacy lookFrom shot in Act IV without r5 will focus wrong under
  your pass; Act IV routes its r5 shots through a real projection now. If post.js could take the near/far from the projection matrix
  itself (projectionMatrix elements [10]/[14]) the mismatch would vanish for every scene.
- 124.6: the dusk foreground. I lifted the scene look (exposure x1.1, fill x1.15, ao <= 0.45 in the pre phase under r5) and
  moved the camera low (sky >= 1/3, the Eraser a silhouette). If it still reads muddy, it is the dusk grade (TOD 123.18-124.9):
  please keep the sky luminous behind the Eraser (it is drawn dark on purpose) and lift the band's backs in the foreground.
- The lock (135.6-139.4): I set dof 1 / dofAmount 0.62 with the focus on the shard field (420-600 u). If LOOK_R5 exposes a
  per-shot DOF override, I will switch to it.
### To the creatures API (promote later)
- The Eraser's "eyes widen" is done with face kinds (grumpy -> blink -> 'look' = arched brows, round eyes, o mouth) + a squash
  bump. A `brows: 0..1` / `eyesWide: 0..1` state would let it be animated instead of switched.
- A `color` multiplier on the Eraser (I set userData.material.color for the silhouette rise) as an official state.

## M1 deliverables (out/review/act4_r5/)
- m1_sheet.jpg: 8 rows, r5 still | reference: 123.4 | k11; 124.6 | v3 124.6; 131.0 | k10; 136.5 | k11; 139.395 | k11; 147.4 | 147.8 (new);
  157.0 | v3 157.0; 145.0 | 166.0. Stills 1080p in m1_stills/ (review flags + --r5). m1_jade_canon.jpg: Jade at 2x from 124.6 / 131.0 /
  136.5 / 157.0.
- A/B without --r5 (review flags minus --r5, 1080p, before the first edit vs after the last): 139.4 and 157.0 `cmp` IDENTICAL, max pixel
  diff 0. (The r5 GLSL is injected only with the flag; the paper material's cache key gets `_r5`; nothing else runs without r5.)
- Beat-timing: no MotionTracks here (Act IV's heroes are the Actor figures; placements are explicit), so no motion warnings. Landings /
  contacts: the vantage landing 135.81 (unchanged v3, on the climb step), the lone-hit whip 138.595, the slam 139.395, y/o/u 147.394 /
  147.494 / 147.594, ENTER 147.693, the eyes cut 147.76, PAINT 148.191, cap landing 149.388 (v3), launch 165.87: all on the grid.

## Self-review against the three rules + the look rules (honest)
- Rule 1 (show the lock before the tools): the lock sequence opens at 135.6 on the held over-shoulder (Jade left third, the chaos, the
  Eraser upper right): 3 s of "what is this mess" before anything moves. `> you`: 3.9 s of an empty prompt before she types. The swarm
  opens on all nine at once (that is the point). OK.
- Rule 2 (one physical twist): the lock = one camera move; the prompt = three letters; the swarm = nine verbs in nine lanes. OK.
- Rule 3 (enemies already here): the Eraser is in frame behind the 画 for the whole lock move, busy rubbing, and stops dead + stares on
  the slam (face 'look', blink, a squash). It looms grumpy over the prompt; its eyes widen on ENTER (147.8 still). OK.
- Camera height: 124.6 chest height behind the band (GY+30); the lock OS5 is 40 u above her eye (E+40, looking down 9 deg: k11's angle);
  F1 at 44 u; F2 at 122 u (a look-up at a 320-u face: it is "chest height" of nothing, but the eyes are the subject); the swarm is the
  designed overhead (GY+102 -> 92). The rebuild / cart shots are v3's (unchanged).
- One key / two colours: the grade is look_r5's; my frames read sand + lilac (dusk), paper + rainbow (lock), grey + green (prompt).
- Focal subject >= 1/3: the Eraser at 124.6 (silhouette, ~45 % height), the 画 at 139.395, the Eraser's face at 145-148 (> 1/2),
  the near row at 157 (~35 %). 131.0: Jade + the lamp (~50 %).
- Layers: 124.6 band backs / ruins / the Eraser + sky; the lock: Charlie's hat + Jade / shards / the Eraser; the swarm: near row /
  chunks / sea + sunset. Sky >= 1/3: 124.6 yes (~40 %), the lock yes, F1 yes (lilac above the face), the swarm ~35 %.
- Tilt-shift on the lock: dof 1 / dofAmount 0.62 focused on the shard field; the far Eraser and the near hat soften (136.5, 139.395).

## Canon audit (m1_jade_canon.jpg, 2x)
- 157.0 (sharp, back): RARE EARTH on one line on the flat back, hair down + pencil in hand (blue cap up, hair rule OK), one orange
  band per upper arm, baggy navy cargo pants, orange straps, white sneakers: PASS.
- 131.0 (3/4 front, hair down, both pencils in hand, headphones on the collar, bare midriff strip): PASS (soft from the k08b DOF).
- 124.6 (bun from behind: both caps up, pink + blue, X in the bun): PASS at this size (small: she is ~180 px tall at 1080p).
- 136.5: her back is intentionally soft (the near layer of the lock tilt-shift); RARE EARTH / straps read as shapes. If the
  coordinator wants her sharp during the hold, lower dofAmount to ~0.4 or move the focus plane nearer.

## Coordinator's M1 notes -> fixes (DONE in code, 2026-10-17 ~10:50)
1. 124.6: the Eraser rises higher (pos.y -> -1900 under r5), camera at knee height (GY+14) 430 u behind the band looking up 10 deg,
   fov 44, the giant pencil (W.props.pencil) hidden from 123.55, r5Shot({ columns: { keep: ['R0', 'R1'] }, beam: 0, dof: 0.2 }) for the
   rise. The Eraser is the biggest, darkest shape (~50 % height) against the dusk sky; the band small in the foreground.
2. 139.395: r5Shot({ dof: 0.3, focus: E + LOCK_DIR * 330, pairAmt: 0, beam: 0 }) from the lone hit to 141.4; the glyph's uGlow +0.5
   after the slam; the scene's own DOF handed to look_r5 (L.dof off under r5). The lit 画 is now the sharpest, most saturated thing.
3. 136.5: 2.6x the shard pieces (buildGlyphField pieceScale 2.6, maxPieces 12, r5 only), r5Shot dof 0.3 on the shard field, pairAmt
   0.3 during the hold, a 3 u (2 %) breathing push over the 3 s hold.
4. 131: shard skin GLSL boost (r5 only: skin = mix(skin * 1.3, hue * 1.9, 0.45)), r5Shot({ pairAmt: 0.15 }) on the page 129.385-135.6.
   Honest: the 130.585-133.1 orbit camera faces away from the shard field (it sits ahead of the vantage), so the vivid shards at 131
   are far; they fill the frame from 133.1 (the climb) and 135.6 (the hold).
5. 157: camera ~35 deg down (1088 -> 1128, GY+205, target (1380, GY+6), fov 55), no sky by design, r5Shot({ beam: 0, dof: 0.3,
   pairAmt: 0.25 }); lanes spread (near row x 1250, mid 1340-1372, far 1452); chunks are graphite wireframe drafts (translucent +
   pencil edges) turning solid colour; Charlie's hat flies from his hand to the chunk spot (0.32 s) and the chunk sprouts; Ricky's
   rings run up each chunk as Jade colours it; the wheel hauls a block up and down its lane; the Eraser rubs strays.
Verification stills were rendered (out/dev/act4_r5/t3, deleted); M2 renders from this state.

## Coordinator's addendum (look_r5's strong preset: focus must be the subject) -> DONE (~11:30)
- Every Act IV frame now calls r5Shot({ focus: <subject>, dof, tilt, ... }) from update(): the band's backs (123.354-125.769, dof 0.18,
  tilt 0.15), Jade on the page (129.385-130.585), the spiral centre (orbit), Jade on the climb, the glyph plane E + LOCK_DIR*330 with
  tilt 0 and protectL 0.5 (135.6-141.4), the Eraser's face (S1), the world field FIELD_P (F1, tilt 0.2: Jade at the bottom edge), its
  eyes (F2), the scene's own focus for S5/S6, Jade in the rebuild (tilt 0.2), the build between chunks 0-1 in the swarm (tilt 0.15,
  beam 0), the cart (tilt 0.15), the pencil tip.
- ROOT CAUSE of "soft everywhere" on the legacy shots: lookFrom() keeps the construction projection P45 (near 0.5) but sets camera.near
  = dist * 0.02 (up to ~67 u on the rise shot); post.js feeds camera.near / far to the DOF depth reconstruction, so the focus distance
  was wrong wherever lookFrom was used. Under r5 those shots go through `lf5()` = shot(pos, target, 45): the SAME fov-45 framing with a
  real projection (byte-identical defaults: lf5 falls back to lookFrom without r5). Verified: the band sharp at 124.6, the glyph sharp
  at 139.395, the face sharp at 142.0 (out/dev/act4_r5/t4, deleted). The v3 camTail / pencil-tip shots keep lookFrom (Act V match cut).
- M2 was re-rendered after this (the first m2.mp4, rendered before the addendum, was overwritten).

## M2 deliverables + checks (out/review/act4_r5/)
- m2.mp4: `node render.js --show main --from 123.354 --to 173.02 --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5
  --look k08b --r5 --mp4 ... --audio --workers 1` (+ --sheet m2_sheet.jpg --sheet-every 1.5 --sheet-cols 8). 1488 frames, 49.6 s.
- A/B without --r5 AFTER the last edit (shadow tree with the backed-up main3d/world4/glyph/render.js vs the live tree, review flags
  minus --r5, 1080p): 139.4 / 157.0 / 131.0 `cmp` IDENTICAL.
- Lip sync, paper clip 125.8-129.3 (m2_lipsync_paper.jpg, every 2nd frame): the cutscene card (paper.js, Jade's pick, lag 0.00, NOT
  mine) opens the mouth from ~126.4 and sings through 都是我的回答; the first 一 (125.86) is nearly closed, i.e. the clip reads ~0.4 s
  late on the first word; Charlie | Ricky split from 128.18 as before. If Jade wants it tighter: paper.js CLIPS lag.
- Lip sync, 3D page 129.9-133.0 (m2_lipsync_3d.jpg): 129.9-130.58 is the over-shoulder (her back); 130.63-131.8 her face reads 3/4
  front and the mouth cells change with the words (是一幅画 也是一段代码), but a 540p crop at 2x is too small to verify each viseme
  frame by frame; recommend a 1080p stills pass over 130.6-131.8 (every 2nd frame) at the M3 gate.
- Canon (m2_jade_canon.jpg from the mp4, 2x): 131.0 PASS (hair down + both pencils, orange bands, patch on the left band, straps,
  baggy pants, sneakers); 150.9 PASS (front, rebuild); 136.5 soft (the lock tilt-shift's near layer); 157.2 small (RTS wide).
  The 124.6 crop box missed her (the new low camera); m1_jade_canon.jpg / m1_stills/124.6.png cover the bun.
- Beat check: no motion warnings from Act IV (the [talos_r5] warnings in the log are theirs); contacts / landings unchanged from M1.

## M2b: the sun disc on the 画 (coordinator's post-M2 fix) -> DONE (~12:10)
- Cause: the glyph's forward Fh was the dusk sun heading F by construction (world4), so the sky's sun disc sat dead centre on the 田
  from E. look_r5's `flare` is already 0 there; the disc is the sky shader's sun itself.
- Dead ends (reverted): r5Shot keyTurn -24 / keyElev 26 and a scene-side turned sun (SUN5) all blacked out the page below the
  horizon in the lock range (every frame rendered after look_r5's 11:25 post.js; 131 / 134 render fine) - the key direction must
  not change there. Not debugged further (not my files); noted for look_r5.
- Fix: the 画 is built 28 deg LEFT of the sun (world4 `F5` = F turned +28 deg about +y, `RT5`; buildGlyphField Fh = F5 under r5).
  The anamorphosis depends on E only, so the lock is exact as before; LOCK_DIR follows the field; OS5 / the post-slam rise / the
  r5 Eraser rest EP1 (E + F5*1500 + RT5*700 = bearing ~25 deg right, over the sun's bearing 28) / Jade's facing at the vantage use
  F5 / RT5. Result (m2b_139.6.png): the 画 reads edge to edge as rainbow hatching, the white trails crisp, the sun disc at the right
  frame edge behind the Eraser's silhouette. uGlow boost after the slam reduced 0.5 -> 0.25 (the 田's centre bloomed white at 140.8).
- Optional 124.6: r5Shot skyGain 1.45 on the rise (gold at the horizon behind the silhouette): m2b_124.6.png.
- NOTE for the stitch: m2.mp4 predates this fix (its lock frames still carry the disc); the half2_v4 render from the live tree will not.

## Open problems / honest notes
1. 123.3 (the signature frame) is Act III's: my range starts 123.354 on battle_r5's last camera; the 123.4 still is their frame. The r5
   low rise camera reaches chest height by 124.525 (drums out); 124.6 is the real "rising silhouette" frame.
2. Jade's FACE never reads 143.48-147.76 (F1 is over her left shoulder: her head peeks above the 2D band at the bottom right) nor in the
   swarm (backs by design). Her face reads at 131.0 (lip sync, 3/4) and in v3's S5/S6 only from behind. If the coordinator wants her
   face on `> you`, F1 could cut to a 0.5 s insert of her face (148.0 on the glider shows her from behind too).
3. F1's 2D band (battle_ui) covers the bottom 30 %: Jade sits under it. battle_r5 is asked for a slim strip (REQUESTS 4).
4. The 2D 'FIGHT' menu at 145.0 is still open (battle_r5's current state keeps it past 144.0); their call.
5. The crumbs on the paper are a flat seeded scatter (not tied to the rub trails' exact geometry); the pencil grid is faint by design
   (reads at 1080p near the camera only).
6. The lock move's u = 0 hold means the camera does not drift for 3 s; motion blur / the shards' drift carry it. If it reads dead, add
   a 2-3 u breathing dolly (easy).
7. The Eraser silhouette = material.color x0.22-0.55 (a hack on the creatures material; see REQUESTS).
8. The swarm: the sun flare sits dead centre over the sea (the key is ahead): look_r5 may want to pull the sunbeam off-centre there.
9. Lip sync: `faceOf()` digs the native rig out of the Actor figure (orient -> F.root.userData.F); it is a no-op on carve / 1.25 figures.
   Not verified frame by frame (the 131.0 still shows the mouth; a short clip is the M2 check).
10. Not done: the design doc's "cursor blinks empty for the whole line" is 143.48 -> 147.394 (the first letter lands on the "need?" beat,
    0.03 s after the word onset 147.36).
