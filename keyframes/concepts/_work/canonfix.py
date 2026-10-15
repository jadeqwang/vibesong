"""Targeted canon edits: NBP edits the whole final frame, then ONLY a feathered box around Jade is pasted back."""
import os, sys, json
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from common import gen, W, CONC
NBP = "google/nano-banana-pro"
UP = os.path.join(W, "refs", "sprite_jade_up.png")
DOWN = os.path.join(W, "refs", "sprite_jade_down.png")
VTRIO = os.path.join(W, "refs", "voxel_trio_k08.png")
KEEP = ("Edit this image. Change ONLY the girl Jade as described; keep every other pixel of the image identical "
        "(composition, framing, other characters, background, objects, colors, lighting, style). ")
HAIR_UP = ("Her hair must be UP: all her long black hair gathered into a neat high bun (no long hair hanging down her "
           "back or shoulders, only a few short loose strands at the face), and two YELLOW pencils pushed THROUGH the bun "
           "like hair sticks, crossing in an X with the crossing hidden inside the bun: one has a BLUE eraser cap, the "
           "other a PINK-ORANGE eraser cap; only the caps and a little of the yellow bodies stick out. Her hands hold "
           "nothing. ")
HAIR_DOWN = ("Her hair must be fully DOWN: long, straight black hair hanging loose past her shoulders, with NO bun "
             "and NOTHING in her hair (remove the bun and both pencils from her head). ")
FIX = {
 "k01": ("k01_cold_open.png", (990, 120, 1500, 600), KEEP + HAIR_UP + "Keep her exact pixel-art sprite style, pose "
         "(mid-leap), size and position; match the attached hair-up pixel sprite reference.", [UP]),
 "k03": ("k03_character_select.png", (778, 124, 1142, 545), KEEP + "Change only the MIDDLE portrait (Jade). " + HAIR_UP +
         "Keep the pixel-art portrait style, face, smile, jacket and headphones; match the attached hair-up pixel "
         "sprite/portrait reference (bun on top, no long hair falling down).", [UP]),
 "k04": ("k04_kaizo_eraser.png", (890, 190, 1170, 545), KEEP + "Change only the middle hero hanging from the blue chain "
         "(Jade). " + HAIR_UP + "Keep her pixel-art sprite style, pose (both hands gripping the chain), size and "
         "position; match the attached hair-up sprite reference.", [UP]),
 "k05": ("k05_void.png", (1260, 150, 1700, 600), KEEP + "Change only the girl singing on the right (Jade). " + HAIR_DOWN +
         "She sings into ONE yellow pencil with a BLUE eraser cap held like a microphone. Keep her pixel-art style, "
         "pose, size and position; match the attached hair-down pixel sprite reference.", [DOWN]),
 "k06": ("k06_fixtures_functions.png", (720, 230, 1045, 655), KEEP + "Change only the girl in the middle swinging the "
         "pencil (Jade). " + HAIR_DOWN + "The pencil she swings has a YELLOW wooden body, a BLUE eraser cap at the end "
         "in her hand, and a RAINBOW multicolor lead at the sharpened tip, from which the rainbow stroke continues "
         "exactly as now. Keep her pixel-art style, pose, size and position; match the attached hair-down sprite "
         "reference.", [DOWN]),
 "k07": ("k07_the_turn_plaster.png", (855, 660, 1065, 1030), KEEP + "Change only the girl in the middle seen from "
         "behind (Jade). " + HAIR_UP + "On the back of her white jacket add one big pale-blue circle (dot). Keep her "
         "blocky voxel style, pose, size and position.", [VTRIO]),
 "k08": ("k08_world_is_my_stage.png", (820, 380, 1120, 870), KEEP + "Change only the girl singing in the center "
         "(Jade). " + HAIR_DOWN + "She sings into ONE yellow pencil with a BLUE eraser cap held like a microphone. "
         "Add one small pale-blue dot on the chest of her white jacket. Keep her blocky voxel style, pose, size and "
         "position.", [VTRIO]),
 "k08b": ("k08b_coop_crossing.png", (590, 230, 870, 850), KEEP + "Change only the girl at the tripod seen from behind "
          "(Jade). " + HAIR_UP + "On the back of her white jacket add one big pale-blue circle (dot). Keep her blocky "
          "voxel style, pose (hand on the tripod), size and position.", [VTRIO]),
 "k09": ("k09_bug_dance_paint_flood.png", (955, 200, 1275, 850), KEEP + "Change only the girl planting the giant pencil "
         "(Jade) and that giant pencil. " + HAIR_DOWN + "The giant pencil she holds gets a YELLOW wooden body, a BLUE "
         "eraser cap on top, and a RAINBOW multicolor lead at the sharpened tip touching the ground (the rainbow wave "
         "stays as is). Keep her blocky voxel style, pose, size and position.", [VTRIO]),
 "k11": ("k11_perspective_lock.png", (340, 450, 700, 1060), KEEP + "Change only the girl seen from behind in the "
         "lower-left (Jade). Her long black hair stays fully down with nothing in it. The pencil she holds at arm's "
         "length becomes a YELLOW wooden pencil with a PINK-ORANGE eraser cap on the end near her hand and a dark "
         "graphite tip. On the back of her white jacket add one big pale-blue circle (dot). Keep her voxel style, pose, "
         "size and position.", [VTRIO]),
}


def run(key):
    fn, box, prompt, refs = FIX[key]
    src = os.path.join(W, "pre_audit", fn)
    out = gen("fix_" + key, NBP, prompt, [src] + refs)
    return out


def apply(key, raw=None, feather=10):
    fn, box, prompt, refs = FIX[key]
    if raw is None:
        n = 1
        while os.path.exists(os.path.join(W, "raw", f"fix_{key}_v{n+1}.png")) or os.path.exists(os.path.join(W, "raw", f"fix_{key}_v{n+1}.jpg")):
            n += 1
        raw = [p for p in (os.path.join(W, "raw", f"fix_{key}_v{n}.png"), os.path.join(W, "raw", f"fix_{key}_v{n}.jpg")) if os.path.exists(p)][0]
    ed = Image.open(raw).convert("RGB").resize((1920, 1080), Image.LANCZOS)
    m = Image.new("L", (1920, 1080), 0)
    x0, y0, x1, y1 = box
    ImageDraw.Draw(m).rectangle([x0 + feather, y0 + feather, x1 - feather, y1 - feather], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(feather / 2))
    patch = ed.convert("RGBA"); patch.putalpha(m)
    patch.save(os.path.join(W, "patches", key + ".png"))
    base = Image.open(os.path.join(W, "pre_audit", fn)).convert("RGBA")
    base.alpha_composite(patch)
    base.convert("RGB").save(os.path.join(CONC, fn))
    # alignment check: mean abs diff outside box
    a = np.asarray(Image.open(os.path.join(W, "pre_audit", fn)).convert("L")).astype(int)
    b = np.asarray(ed.convert("L")).astype(int)
    out = np.ones_like(a, bool); out[y0:y1, x0:x1] = False
    print(key, "applied from", os.path.basename(raw), "outside-box diff", round(float(np.abs(a - b)[out].mean()), 1))


if __name__ == "__main__":
    import concurrent.futures as cf_
    keys = sys.argv[1:]
    with cf_.ThreadPoolExecutor(5) as ex:
        list(ex.map(run, keys))

FIX["k04"] = ("k04_kaizo_eraser.png", (890, 190, 1170, 545), KEEP + "Change only the middle hero hanging from the blue "
              "chain (Jade). Her pose stays EXACTLY as now: she HANGS from the blue chain with BOTH arms raised straight "
              "up and BOTH hands gripping the chain links, legs swinging below. Only her hair changes: " + HAIR_UP +
              "(Her hands hold the chain, not pencils.) Keep the pixel-art sprite style, size and position; match the "
              "attached hair-up sprite reference for the bun.", [UP])
FIX["k06"] = ("k06_fixtures_functions.png", (720, 230, 1045, 655), KEEP + "Change only the girl in the middle and the "
              "pencil she swings (Jade). Her hair stays fully down with nothing in it. The pencil she swings must look "
              "like a normal school pencil: its long wooden BODY is solid plain YELLOW (not rainbow, not striped), with a "
              "BLUE eraser cap at the end in her hand and a RAINBOW multicolor lead only at the very sharpened tip, from "
              "which the rainbow stroke continues exactly as now. Keep the pixel-art style, pose, size and position.",
              [DOWN])
FIX["k08b"] = ("k08b_coop_crossing.png", (590, 230, 870, 850), KEEP + "Change only the girl at the tripod seen from "
               "behind (Jade). Her hair must be fully UP: ALL of her hair gathered into one compact high bun on the back "
               "of her head, with NOTHING hanging down from the bun (no ponytail, no long hair on her back or "
               "shoulders); the back of her neck and the jacket's big pale-blue back dot are clearly visible. Two "
               "yellow pencils go through the bun crossing in an X (one blue eraser cap, one pink-orange eraser cap). "
               "Keep her blocky voxel style, pose (hand on the tripod), size and position.", [VTRIO])
FIX["k09"] = ("k09_bug_dance_paint_flood.png", (800, 760, 1820, 1078), KEEP.replace("the girl Jade", "the bugs") +
              "Fix ONLY the cute voxel bugs on the ground to match the attached bug design sheet (same species designs, "
              "rendered in the same 3D voxel style as now, same positions and sizes): the RED LADYBUG stays (red shell, "
              "black spots, black head, cream face). The BEETLE is DARK TEAL-BLUE with a glossy shell (not green) and "
              "keeps turning into a wheel. The pale winged creature in the middle must be split into TWO bugs: a cream "
              "MOTH with brown-patterned wings and feathery brown antennae, and next to it a GREEN segmented "
              "CATERPILLAR with little orange spots, many tiny legs and two short orange-tipped antennae, with NO WINGS "
              "at all. The FIREFLY has a dark navy body, a cream face, light-blue wings and a glowing yellow tail. "
              "Do not change Jade, the giant pencil, the boys, the floor or anything else.", [os.path.join(W, "refs", "bugs_sheet.png")])


def run_cur(key):
    """Edit starting from the CURRENT final (k09 bugs on top of the Jade fix)."""
    fn, box, prompt, refs = FIX[key]
    return gen("fix_" + key + "_bugs", NBP, prompt, [os.path.join(CONC, fn)] + refs)

FIX["k08b3"] = ("k08b_coop_crossing.png", (590, 230, 870, 850), KEEP + "Change only the girl at the tripod seen from "
                "behind (Jade): replace her hairstyle with EXACTLY the hairstyle of the attached back-view reference: a "
                "compact round bun high on the back of her head, the rest of the hair smoothly pulled up, the nape of her "
                "neck bare, and absolutely no hair hanging below the bun or onto her back. Keep the two yellow pencils "
                "through the bun in an X (blue cap and pink-orange cap). Keep her body, jacket with the big pale-blue "
                "back dot, pose, size and position exactly.", [os.path.join(W, "refs", "k07_jade_back_bun.png")])
FIX["k09b"] = ("k09_bug_dance_paint_flood.png", (800, 100, 1820, 1078), KEEP.replace("the girl Jade", "the objects described") +
               "Two fixes only. (1) The GIANT PENCIL Jade holds: its whole wooden body from the blue eraser cap down to "
               "the sharpened cone is solid plain YELLOW (no rainbow stripes on the body); only the little lead at the "
               "very tip is rainbow multicolored, touching the ground where the rainbow burst is. (2) Bugs, matching the "
               "attached bug sheet, in the same voxel style and positions: the pale creature in the middle that has "
               "wings AND a long striped worm body must become a proper MOTH: a short fuzzy cream body, cream wings with "
               "brown patterns, feathery brown antennae, six small legs, no long striped body. The FIREFLY (flying, "
               "right) gets a dark NAVY body, cream face and light-BLUE wings with its glowing yellow tail. Keep the "
               "ladybug, the teal beetle-wheel and the green caterpillar exactly as they are. Change nothing else.",
               [os.path.join(W, "refs", "bugs_sheet.png")])

MOTH = ("Edit this close-up. Keep everything identical (voxel style, lighting, floor, shadows, the green caterpillar on the "
        "right, the beetle wheel on the left, the colored pencil burst) except the pale winged creature in the middle: "
        "it must be a proper MOTH from the attached bug sheet, built from voxels: a SHORT, fuzzy, rounded cream body "
        "(about as long as its wings, ending in a short blunt abdomen), cream wings with brown patterns, feathery brown "
        "antennae, big dark eyes, six small legs, standing in a dance pose. REMOVE completely the long yellow-and-purple "
        "striped worm body that currently trails behind it; where it was, show only the plain white plaster floor and "
        "soft shadow. No text.")
