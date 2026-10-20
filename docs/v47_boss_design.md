# v47_boss: the Eraser boss fight, 129.385-143.4 (design, PHASE 1)

Jade on v4.6 (2:10): "it would be cool if we could tell that the light spiral was being cast by Ricky and our new bug friends or
what's going on here? And I think this boss battle could be made visually more coherent and interesting." Standing note: Charlie and
Ricky should DO things (their guitars power the world). Unit brief: docs/v47_brief.md. Checkpoint: engine/checkpoints/v47_boss.md.

Mocks (real engine frames from a prototype in a shadow tree, src untouched; left = v4.6, right = the mock):
`engine/out/review/v47/v47_boss/design/` 01-08 before/after, 09 option B, 10 colour-script note, `sheet_before_after.jpg`.
Prototype patch: `engine/out/bak_v47/v47_boss/proto/*.diff` (about 260 lines; the Phase 2 starting point).

## 1. What's wrong now (frame by frame, full_v4.6b)

| time | what you see | problem |
|---|---|---|
| 129.4-130.6 | low behind Jade; grey page; orange hatch streaks floating; black crumbs; the party, lamp, caterpillar and ladybug in a knot | No subject and no threat. The **Eraser is not in a single frame from 125.8 to 135.6**, so nobody is fighting anything. The orange streaks are the "colour shells" of the erased buildings. They read as random debris. |
| 130.6-133.1 | orbit round the knot; a white ribbon wraps the group | **The spiral has no source.** Its base sits inside the cluster (radius 34 u around heroes that stand 69 u tall), Ricky has his back to us, and the ribbon is white. The bugs stand around but don't do anything. The orbit flips the screen direction. |
| 133.1-135.6 | side view; Charlie and Jade climb a faint ribbon; ruins, cypresses and temples behind | Clutter behind the action. The goal (the floating 丶 vantage) was never shown, so the climb has no destination. Still no Eraser. |
| 135.6-139.4 | over the shoulder; shards plus white 凵 strokes; a small Eraser face at the right edge | This part works (approved k11 lock), but we never saw where the white strokes came from, so "erasing was drawing" can't land. |
| 139.4-141.4 | 画 ignites; sunset; the colour pours back | Works. It's the payoff. |
| 141.4-143.4 | Eraser close-up, then Jade front-on, then card 06 | The turn toward friendship is a cut, not a beat: there's no reaction in between. |

In one sentence: it's a puzzle with no opponent, a spell with no caster, and a payoff (the 凵 trails) with no setup.

## 2. The idea

**Every attack the Eraser makes draws part of 画.** It charges the party, rubbing the left stroke of 凵 into the page on each beat.
The party answers with colour, which it can't erase. Ricky holds his note and the beam leaves his headstock as the spiral. The five
bug-features braid their own colours into it, one per 8th (the roll call). The finished braid fires a ring of light along the
page. The ring meets the rubber at the corner of 凵 on the strongest drum hit (132.603) and knocks it sideways: the skid is the
bottom stroke. It backs off rubbing the right stroke while Charlie and the caterpillar lead the climb up the braid. From the vantage
Jade sees it: the white trails of its attacks, plus the colour it couldn't erase, are 画. On the slam its own trails light up, it
stops dead, and the rainbow smudge it already wears (the creature canon: "it rubbed colour and it would not come off") is the hint
that card 06 cashes in.

Cause and effect the viewer can retell: *Ricky's note + the bugs' colours = a bridge that can't be erased; the Eraser attacks it and
bounces; its attack paths become the bottom of the character; seeing that, Jade stops fighting it.*

The geometry is real. The trail polylines come from the glyph's own ground strokes (glyph.js `groundLambda` / medians 6 and 7,
projected through E). Stroke 6 runs from far out (1636, -270) toward the vantage, turns at the corner (1336, 221), and runs along the
bottom to (1511, 303). The writing order of 𠃊 *is* a charge followed by a deflection. Stroke 7 runs from near (1406, 358) out to
(2237, -15). The Eraser's base follows the exact point the reveal shader is uncovering (font-arc parameter), so trail and body never
drift apart.

## 3. Beat sheet (measured: data/cues.json act4, timing.json beat grid, stems)

Music notes. The "other" stem is one sustained note from ~129.6 to 137.0 (Ricky's held note). The half-time hits 129.385 / 130.585 /
131.785 / 132.985 fall every 3 beats (a hemiola against the 4/4). The strongest drum onset in the window is 132.603 (bar 80 beat 4).
Triplet roll 133.105-135.81. Band cut 137.03, lone hit 138.595, slam 139.395.

| t (s) | bar.beat | music | picture (who does what) | camera |
|---|---|---|---|---|
| 129.385 | 78.4 | drums back, ht 1, "是一幅画" | Jade pulls both pencils from her bun (hair drops: canon). Charlie + Ricky play the band back in (Charlie on the 8ths, Ricky on the quarters). **The Eraser is already on the page**, on the far end of stroke 6, rubbing toward them one shove per beat, crumbs off its worn edge. The vantage 丶 floats above the empty spiral spot: the goal. | **S1 ESTABLISH**: low 3/4 behind the party toward the boss. Party left third, Eraser right third (~45% of frame height, 5x the heroes), shards between, sky on top. Slow push. (01) |
| 130.585 | 79.3 | ht 2, held note starts, "也是" | **Ricky's chord:** he lifts the neck (voxfig 'sustain') and the beam leaves his headstock, arcs up and becomes the first strand of the spiral, climbing as the note holds (his strand reaches the top by 131.8). | **S2 RICKY CASTS**: low medium on Ricky 3/4 front, Charlie strumming beside him, the bugs at his feet, the beam leaving frame right-up into the spiral. (02) |
| 130.79-131.59 | 8ths | "一段代码" | **Roll call:** firefly lamp (gold) 130.786, ladybug button (red) 130.987, caterpillar (green) 131.188, beetle wheel (teal) 131.389, moth glider (violet, from the air) 131.590. Each bug hops and sends an arc of its colour into the spiral's base; each strand races up the braid after Ricky's. | same shot (03) |
| 131.785 | 80.2 | ht 3 | **The braid fires:** a flash runs up it, and a ring of the casters' light races out along the page (the v45_jam ring, recoloured, from the spiral). The Eraser keeps charging. | **S3 THE CHARGE**: back on the S1 axis, lower and closer, the Eraser looming, the ring travelling toward it. (04) |
| 132.603 | 80.4 | strongest drum hit | **The hit:** the ring meets the rubber at the corner of 凵. It rocks back, gets knocked sideways and skids along the bottom stroke (squash, crumb burst, face 'look' = shocked, a blink). Charlie and Jade break for the spiral. | same shot, small shake (05) |
| 132.985 | 81.1 | ht 4, "一笔一画" | It recovers, grumpy, and backs off, rubbing stroke 7 outward (the right stroke of 凵), then slides to its lock spot EP1 by 135.35. | |
| 133.105-135.81 | triplets | roll | **The climb (kept, re-aimed):** Charlie runs up the braid first (hat trampoline at the top as now), the caterpillar scurries up ahead of him on the triplets, Jade climbs on the triplets; bounce 135.0 / apex 135.405 / land 135.81 on the vantage. **Ricky stays at the base holding the note:** he's what keeps the bridge alive. | existing side view, widened and aimed a little toward the Eraser so it backs off at frame right, its trails visible. (06) |
| 135.6-139.395 | 82.3-85.1 | "I think about stuff I read", band cut, lone hit | **The lock (kept as approved):** no-cut move, Eraser frame right at EP1, the 凵 on the page now recognisably its own attack paths. Charlie's lone-hit bolt (LOCK_V45) as now. | existing (07) |
| 139.395 | 85.1 | SLAM | 画 ignites (kept). **New:** the trails' ignite runs as a front along stroke 6 and stroke 7 toward the Eraser's feet (rainbow racing down its own paths). It stops dead and stares (r5, kept). | existing (08) |
| 141.4-142.605 | 86.2-87.1 | "...read" held | **The turn:** close on its face (S1 as now). Acting: it looks at the 画, then tips forward to look down at the lit trail under its own edge, then its brows lift ('grumpy' -> 'look'). The scrubbing stops; its arms drop. | existing S1 |
| 142.605-143.4 | 87.1 | bar 87 | Jade front-on (kept): she **lowers the pencil** (no longer aimed) and turns her head screen-right toward it, soft. Eyeline matches card 06 (Jade left, Eraser right). | existing front-on |
| 143.4 | 87.3 | card 06 | v47_cards owns it (befriending). Screen direction is continuous: party/Jade left, Eraser right, since 129.385. | |

## 4. Camera grammar

One axis for the whole fight: **party screen-left, Eraser screen-right, the vantage between** (the JRPG side-view convention the battle
UI already speaks). Establishing (S1, a full 3-beat half-time unit), then coverage on the caster (S2), then back to the axis for the
consequence (S3). The cuts land on the half-time hits (130.585, 131.785), same count as today (5 cuts in 129.4-135.6). The hero shot
stays the approved lock. No orbit, so no flipped screen direction.

## 5. Value and colour plan

- **Colour lives only on the party's side**: the heroes (canon), the five bug-features, the braid, the feeds, the ring, the floating
  shards (the colour that survived). Everything else is paper and graphite: cream page, the grey rubber, the white trails.
- **Values**: the page is light; the Eraser is the darkest, biggest mass, against a lighter dusk sky (S1/S3); the braid is the most
  saturated thing in frame. The braid is drawn in **solid pencil colour** (normal blend, mid values), not additive glow. The additive
  version whitens out under tone mapping and the colour-script drain: that's why today's spiral reads white. Mock 03 shows the colours
  surviving the drain.
- **Colour script**: today's drain (sat 0.14, dusk tint 0.6) stays; the slam payoff depends on it. I tested a lift for 129.34-139.395
  (mock 10). The difference is small, so I **don't** recommend touching core/colorscript.js. The greyness Jade's frames show came
  from the mid-grey clutter (shells, ruins, the knot), not the drain.

## 6. What goes

- The floating colour shells (orange hatch streaks) and the ruins / cypress / temple remnants on the fight's page (129.385+): the
  shards already carry "colour survives", and the shells doubled it as noise. (Unchanged before 129.385; 125.8-129.4 is the paper card.)
- The cluster knot inside the spiral: the party and bugs stand outside it, Ricky at its base.
- The orbit camera 130.585-133.1. The caterpillar's "gap" in the ribbon (no gap now: the braid can't be broken, and that's the rule).
- The glider's aimless circling (it feeds from the air, then circles the braid).
- Optional, low priority: thin the black crumbs to the trails only (they read as dirt).

## 7. Options (the taste fork)

`const BOSS_V47` in act4/main3d.js: `null` = v4.6 exactly.
- **A `'coverage'` (recommended):** S1 establish / S2 Ricky casts / S3 the charge + hit. It answers Jade's note literally: you *see*
  the beam leave Ricky's headstock and each bug feed it.
- **B `'arena'`:** one locked wide 129.385-133.105 (S1's axis, a slow push): a boss screen where cast, roll call, ring and hit
  happen in one frame (mock 09). It's more game-like and every cause and effect sits in one frame. The casters are smaller, though,
  so "who casts it" is shown rather than featured.

I'd render both clips (127-147, 540p, audio) and recommend A. A garnish I'd only build if you or Jade want it spelled out: two JRPG
callouts at the top of frame ("THE ERASER uses RUB OUT!" 131.0, "RICKY + 5 BUGS · LIGHT BRAID" 131.785). I don't recommend them
(the v3 critique stripped the HUD, and the diegetic version reads in the mocks).

## 8. Build plan (Phase 2, ~3-4 h, $0 gen)

Behind `BOSS_V47` (+ r5), small Edit-tool edits, re-reading main3d.js before each edit (v47_hands shares it for guitar-pose calls):
1. world4.js `makeSpiral`: braid mode (uBraid, 6 strands, normal blend, per-strand progress and colour, flash). Default path
   byte-identical.
2. glyph.js `patchPaperGround`: `uTrailB` (stroke 7 revealed from its near end) + an ignite front parameter along the trails;
   default 2 = today's behaviour.
3. main3d.js: the B47 block (trail sampling, `eraser47()`, feeds, spots), hooks in worldState (shells off on the fight page,
   trails, braid), eraserState (path, tilt, scale 210 during the fight, 290 at EP1 by 135.35), heroState (Ricky / Charlie playFig,
   Jade's spot and run on the hit, Charlie's run from 132.985), pageFeatures (ring of bugs, caterpillar leads the climb, glider
   feeds), jamLight.state (one boss ring from the spiral), camera (S1-S3 / arena, climb re-aim), r5Shot. Then the turn: the ignite
   front on the slam, the Eraser's look-down + brow lift 141.4-142.6, Jade lowers the pencil + head turn 142.605-143.4.
4. Vantage 丶: a soft glow pulse on the beats from 129.385 so it reads as the goal (today it reads as a floating carrot).
5. Polish found in the mocks: a clear contact flash + crumb burst at the hit; the bug feed arcs a touch thicker; the Eraser stays
   clear of Jade in S3 (the prototype's S3 lets it cover her).
6. Clips `engine/out/review/v47/v47_boss/boss_{v46,coverage,arena}.mp4` (127-147, 540p, audio, --workers 1), Jade canon crops 2-4x
   (hair down + pencils in hand from 129.9; patch, bands, pants), Charlie's hat, Ricky.

Risks: the Eraser at 336 u can cover the party in S3 if the camera is too close (fix by framing). The ring has to read at 540p.
Guitar poses are v47_hands' rig: I only call playFig/figPose with phases, so their fix flows through. The 135.6 lock onward is kept,
so the approved k11 frames don't change except for the Eraser's arrival at EP1 and the trail reveal.

## 9. As built (Phase 2, 2026-10-19; checkpoint engine/checkpoints/v47_boss.md)
Option A live (`BOSS_V47 = 'coverage'`), plus `'coverage_ui'` per the coordinator: three short JRPG windows at the top of frame in the
battle UI's pixel font: `RICKY + BUGS · LIGHT BRAID` (130.585, five squares light in each bug's colour on its 8th), `THE ERASER uses
RUB OUT!` (131.785, top right = the boss side), `It can't erase colour!` (132.603). Changes from the mocks: saturated pencil colours
with normal blend + depth write (the additive versions washed to white); all five bugs in the S2 frame, each hopping and lit in its
colour as its stream joins; the ring is its own coloured-pencil band (not the jam's warm light); the vantage became a gold stepping
stone with a faint beacon (the orange teardrop read as debris); the climb is framed so the bounce and landing stay in shot.
Clips engine/out/review/v47/v47_boss/boss_{v46,coverage,coverage_ui}.mp4.
