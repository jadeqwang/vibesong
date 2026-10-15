# Jade canon audit: concept keyframes (2026-10-14)

Rules (bible "Look" row):
- Pencils in her hair → hair UP in a bun. Two yellow pencils go through the bun, crossed in an X; the crossing is hidden in the bun. One cap is BLUE, the other PINK/ORANGE.
- Pencils in her hands → hair fully DOWN, and the bun is empty. Never both at once.
- Leads: the blue-cap pencil has a RAINBOW core; the pink-cap pencil has a GRAPHITE core.
- Jacket: white, cropped, orange stripes, band collar with a snap tab, epaulets. One small pale-blue dot on the chest, a big pale-blue dot on the back (with RARE EARTH under it), and the 1420 MHz patch on the sleeve.

Method: Jade was cropped from every frame at 2–4× and checked by eye (crops are in `audit/`).

| Frame | Hair (before) | Pencils (before) | Jacket (before) | Verdict | Fix |
|---|---|---|---|---|---|
| k01 cold open (pixel) | long, down AND a small bun | 2 in the bun, parallel-ish, orange and blue caps; hands empty | white + orange stripes; no dot, no collar | **VIOLATION** (down + pencils in hair) | NBP edit to hair up in a bun with X pencils, using the hair-up sprites as reference; patched back in its box only |
| k02 RUN IT | no Jade | — | — | n/a | — |
| k03 character select (pixel portrait) | long, down AND a bun | 2 in the bun (orange and blue caps) | stripes; no dot | **VIOLATION** | NBP edit to a bun with X pencils. Item icons were a gray graphite pencil and an all-rainbow pencil (not yellow bodies): redrawn in code as yellow pencils (pink cap + graphite lead; blue cap + rainbow lead). Bios replaced with Jade's wording |
| k04 Kaizo run (pixel) | long, down AND a bun | 2 in the bun (blue and pink caps); hands on the chain | stripes | **VIOLATION**. The HUD portrait has the same problem | NBP edit to a bun with X pencils. HUD portrait replaced in code with the canon `assets/sprites/portrait_jade.png` |
| k05 VOID (pixel) | long, down AND a bun | 1 in her hand as a mic, AND 2 in the bun | stripes, headphones | **VIOLATION** (holding a pencil, so the bun must be empty) | NBP edit: hair fully down, nothing on her head, a yellow pencil with a blue cap as the mic |
| k06 fixtures/functions (pixel) | long, down AND a bun | swings an all-rainbow-bodied pencil, AND 2 in the bun | stripes | **VIOLATION** (also a non-yellow body) | NBP edit: hair down, bun gone; the held pencil gets a yellow body, blue cap and rainbow lead (the rainbow stroke stays) |
| k07 after THE TURN (voxel, back view) | long, down AND a bun | 2 in the bun, hands empty | back of the jacket plain (no big dot) | **VIOLATION** + jacket | NBP edit: hair up in a bun with X pencils, big pale-blue dot on the back |
| k08 world is my stage (voxel) | long, down AND a bun | holds a pencil-mic AND 2 in the bun | stripes; no chest dot | **VIOLATION** | NBP edit: hair fully down, no bun; mic = yellow pencil with blue cap |
| k08b co-op crossing (voxel, back 3/4) | long, down AND a bun | 2 in the bun (X), hands empty | back plain | **VIOLATION** + jacket | NBP edit: hair up in a bun with X pencils; big pale-blue back dot |
| k09 paint flood (voxel) | long, down AND a bun | holds the giant every-color pencil (rainbow body) AND 2 in the bun | stripes | **VIOLATION** (also a non-yellow body) | NBP edit: hair fully down, no bun; giant pencil gets a yellow body, blue cap and rainbow lead |
| k10 bridge (paper, v3 face) | updo bun | 2 through the bun, X, crossing hidden; blue cap with a rainbow lead (added in code), pink cap; hands hold the sheet | collar tab, epaulets, zip, chest dot, stripe | OK | — (the face predates v4 brows; not changed) |
| k11 perspective lock (voxel, back view) | long, down | 1 in her hand at arm's length (dark body); none in her hair | back plain | pencil body not yellow + jacket | NBP edit: yellow pencil with a pink cap and graphite lead; big pale-blue back dot |
| k12 / k13 / k13b / k13c aerials | heroes are 2–6 px dots | — | — | n/a | — |

Not fixed anywhere: the 1420 MHz sleeve patch and the RARE EARTH lettering. Both are too small to read at concept scale, and models garble lettering.

## Results after the fix pass

Every fix went through `_work/canonfix.py`:
1. nano-banana-pro edits the whole frame (the reference is the hair-up or hair-down sprite strip, the voxel trio, or the bug sheet).
2. Only a feathered box around Jade, or around the bugs, is pasted back onto the untouched original. Everything outside the box is the original's pixels.
3. Originals are kept in `_work/pre_audit/`; the patches are in `_work/patches/`.

| Frame | Now |
|---|---|
| k01 | Bun with yellow X pencils (blue and pink caps); no long hair. OK |
| k03 | Portrait: bun with X pencils. Item icons redrawn in code as yellow pencils (pink cap + graphite lead; blue cap + rainbow lead). Bios use Jade's wording. OK |
| k04 | Second take (the first changed her pose): hangs from the chain, bun with X pencils. HUD portrait replaced with canon `portrait_jade.png`. OK |
| k05 | Hair down, nothing in it; sings into a yellow pencil with a blue cap. OK |
| k06 | Hair down; swings a yellow pencil with a blue cap and a rainbow tip. Second take (the first kept a rainbow body). OK |
| k07 | Back view: bun with X pencils, big pale-blue back dot. OK |
| k08 | Hair down; yellow pencil mic with a blue cap; chest dot. OK |
| k08b | Third take: compact bun with X pencils, nape bare, back dot. OK |
| k09 | Hair down; giant pencil is now a yellow body with a blue cap and a rainbow tip. OK |
| k11 | Hair down; yellow pencil with a pink cap and graphite tip; back dot. OK |
| k10 | Unchanged (already canon). |

The X crossing is drawn as the two pencils fanning out of the bun. The crossing itself is hidden, which is per canon.

## Bug audit vs `assets/sheets/bugs_sheet.png`

Bugs appear only in k09; no other frame has bugs.

| Bug | Before | After |
|---|---|---|
| Ladybug | red shell, black spots, black head | unchanged (matches) |
| Beetle | GREEN shell, wrong color (sheet is dark teal-blue) | teal-blue glossy shell; still turning into a wheel |
| Moth | merged with the caterpillar: moth wings on a long yellow/purple striped worm body | separate moth: short fuzzy cream body, cream wings with brown patterns, feathery brown antennae |
| Caterpillar | had WINGS (fused with the moth) | separate green segmented caterpillar with orange spots, little legs and orange-tipped antennae; no wings |
| Firefly | brown body, white wings, glowing tail | navy body, light-blue wings, glowing yellow tail |

Remaining: the moth still has a faint purple-striped belly, a remnant of the old worm body.
