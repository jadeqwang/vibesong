"""v4.7 (unit v47_cards): MEDIUM-SHOT first frames for the singing cards. The approved still is scaled down (SCALE) into a 16:9 cream
canvas, nano-banana-pro extends the drawing outward (more of her body, both hands, the surroundings), then the still's own pixels go
back in the middle under a feathered mask (face, hair, pencils untouched) with a per-row/column colour match at the seams.
    $PY tools/cutscenes/pb_outpaint47.py CARD SRC.png OUTDIR [--skip]      CARD 03|04|06   (PY = moongazing venv: PIL + numpy + scipy)"""
import sys, os, numpy as np
from PIL import Image
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/gen"); import cf
card, src, od = sys.argv[1:4]; os.makedirs(od, exist_ok=True)
COMMON = ("The FIRST image is a colored-pencil drawing on cream paper whose OUTER areas (all around the sharp middle) are blurry, "
          "smeared and unfinished. Redraw those blurry outer areas as finished drawing that continues the scene seamlessly right to all four "
          "edges of the frame, so the whole image is one wider MEDIUM SHOT of the same moment with NO border, NO frame, NO panel edge, in exactly "
          "the same colored-pencil style (same pencil lines, soft hatching, cream paper texture, same colours). Do not change anything "
          "inside the existing drawing: her face, hair, eyes, mouth, headphones, jacket and everything else stay exactly as they are, same "
          "position and size. Her outfit continues per the character design: the white cropped jacket with ONE horizontal orange band "
          "around each upper arm and white cuffs and white hem, the black high-neck crop top ending above the waist with a strip of bare "
          "midriff, then full-length wide-leg baggy navy cargo pants with long orange straps hanging from the belt. ")
CARDS = {
    "03": dict(scale=0.74, x0=500, y0=40, p=COMMON + (
        "Continue her body below the frame: her waist, the belt and the top of the navy cargo pants. Show BOTH of her arms and BOTH "
        "hands, relaxed, empty and open in front of her waist (no pencils in her hands: the two pencils stay in her bun). Continue the "
        "blue drawn chain of everyday things to the right and the soft pastel hatching on the left. No new people, no text, no logos.")),
    "04": dict(scale=0.74, x0=None, y0=40, p=COMMON + (
        "Continue her body below the frame: her waist, the belt and the top of the navy cargo pants. Show BOTH of her arms and BOTH "
        "hands, relaxed and empty, one hand loosely at her side and the other resting near her waist (no pencils in her hands: the two "
        "pencils stay in her bun). Continue the pale blue blueprint grid and add nothing else. No new people, no text, no logos.")),
    "06": dict(scale=0.74, x0=None, y0=60, p=COMMON + (
        "Her long black hair stays loose. Continue her body below the frame: her waist, the belt and the top of the navy cargo pants; "
        "her other arm (image left) hangs relaxed with an EMPTY open hand; her raised hand keeps holding the same single yellow pencil. "
        "Continue the big gray rubber-eraser creature on the right: more of its soft blocky gray body and one stubby gray arm, the same "
        "face and eyes. Continue the lavender-to-peach dusk sky. No new people, no text, no logos.")),
}
c = CARDS[card]; S = Image.open(src).convert("RGB").resize((1920, 1080), Image.LANCZOS)
w, h = int(1920 * c["scale"]), int(1080 * c["scale"]); x0 = c["x0"] if c["x0"] is not None else (1920 - w) // 2; y0 = c["y0"]
small = S.resize((w, h), Image.LANCZOS); # (r2) the border is the still's own edge pixels replicated outward and blurred (a cream border read as a picture frame to the model)
import cv2
sm = np.asarray(small); bd = cv2.copyMakeBorder(sm, y0, 1080 - y0 - h, x0, 1920 - x0 - w, cv2.BORDER_REFLECT_101)
bl = cv2.GaussianBlur(bd, (0, 0), 25); yy0, xx0 = np.mgrid[0:1080, 0:1920]
inside = np.clip(np.minimum(np.minimum(xx0 - x0, x0 + w - 1 - xx0), np.minimum(yy0 - y0, y0 + h - 1 - yy0)) / 12.0, 0, 1)[..., None]
can = Image.fromarray((bd * inside + bl * (1 - inside)).astype(np.uint8))
can.save(od + f"/canvas{card}.png"); open(od + f"/geom{card}.txt", "w").write(f"{x0} {y0} {w} {h}\n")
raw = od + f"/outpaint{card}_raw.png"
if "--skip" not in sys.argv:
    cf.generate("google/nano-banana-pro", {"prompt": c["p"], "image_input": [f"file:{od}/canvas{card}.png"], "aspect_ratio": "16:9",
                                           "image_size": "2K", "output_format": "png"}, raw, tag=f"v47_{card}_medium")
G = np.asarray(Image.open(raw).convert("RGB").resize((1920, 1080), Image.LANCZOS), float); C = np.asarray(can, float)
from scipy.ndimage import gaussian_filter1d
# colour match: per-row offset at the left/right seams, per-column at top/bottom, fading over 400 px outside the strip
for side in "LRTB":
    if side in "LR":
        if side == "L" and x0 < 8: continue
        if side == "R" and x0 + w > 1912: continue
        d = (C[y0:y0 + h, x0 + 6:x0 + 26].mean(1) - G[y0:y0 + h, x0 - 20:x0].mean(1)) if side == "L" else \
            (C[y0:y0 + h, x0 + w - 26:x0 + w - 6].mean(1) - G[y0:y0 + h, x0 + w:x0 + w + 20].mean(1))
        d = gaussian_filter1d(d, 25, axis=0); dd = np.zeros((1080, 3)); dd[y0:y0 + h] = d
        cols = np.arange(1920); dist = (x0 - cols) if side == "L" else (cols - (x0 + w - 1))
        wgt = np.clip(1 - dist / 400.0, 0, 1) * (dist >= -40); G += dd[:, None, :] * wgt[None, :, None]
    else:
        if side == "T" and y0 < 8: continue
        if side == "B" and y0 + h > 1072: continue
        d = (C[y0 + 6:y0 + 26, x0:x0 + w].mean(0) - G[y0 - 20:y0, x0:x0 + w].mean(0)) if side == "T" else \
            (C[y0 + h - 26:y0 + h - 6, x0:x0 + w].mean(0) - G[y0 + h:y0 + h + 20, x0:x0 + w].mean(0))
        d = gaussian_filter1d(d, 25, axis=0); dd = np.zeros((1920, 3)); dd[x0:x0 + w] = d
        rows = np.arange(1080); dist = (y0 - rows) if side == "T" else (rows - (y0 + h - 1))
        wgt = np.clip(1 - dist / 400.0, 0, 1) * (dist >= -40); G += wgt[:, None, None] * dd[None, :, :]
m = np.zeros((1080, 1920), np.float32); f = 60
yy, xx = np.mgrid[0:1080, 0:1920]
dx = np.minimum(xx - x0, x0 + w - 1 - xx); dy = np.minimum(yy - y0, y0 + h - 1 - yy)
m = np.clip(np.minimum(dx, dy) / f, 0, 1).astype(np.float32)
out = (C * m[..., None] + G * (1 - m[..., None])).clip(0, 255).astype(np.uint8)
Image.fromarray(out).save(od + f"/ff{card}_medium.png"); Image.fromarray(G.clip(0, 255).astype(np.uint8)).save(od + f"/ff{card}_medium_rawmatched.png")
print(od + f"/ff{card}_medium.png", x0, y0, w, h)
