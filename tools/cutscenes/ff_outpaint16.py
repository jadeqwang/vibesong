"""Outpaint the keeper's portrait frame 0 to 16:9 (nano-banana-pro), then put the keeper's own pixels back in the centre
(feathered), so her face and figure stay untouched."""
import sys, numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/gen"); import cf
O = "media/cutscenes/_work/r720/"
P = ("The FIRST image is a coloured-pencil drawing on cream paper in a tall vertical strip in the middle, with blank cream on "
     "the left and right. Extend the drawing to fill the whole 16:9 frame: continue the same soft dusk sky in coloured pencil "
     "(lavender-violet at the top, warm peach and pink lower down, loose diagonal hatching on cream paper) out to the left and "
     "right edges, and continue her white jacket sleeves and the sheet she holds naturally where they meet the edge of the strip. "
     "Do not change anything inside the middle strip: the young woman, her face, hair, pencils, headphones, hands and the sheet "
     "stay exactly as they are, same position and size. No new people, no objects, no text.")
raw = O + "outpaint_raw.png"
if "--skip" not in sys.argv:
    cf.generate("google/nano-banana-pro", {"prompt": P, "image_input": [f"file:{O}canvas16x9.png"], "aspect_ratio": "16:9",
                                           "image_size": "2K", "output_format": "png"}, raw, tag="cut_ff_jade")
x, w = map(int, open(O + "geom.txt").read().split())
c = Image.open(O + "canvas16x9.png").convert("RGB"); g = Image.open(raw).convert("RGB").resize(c.size, Image.LANCZOS)
m = np.zeros((c.height, c.width), np.float32); f = 40
m[:, x + f:x + w - f] = 1
for i in range(f): m[:, x + i] = m[:, x + w - 1 - i] = i / f
out = (np.asarray(c, float) * m[..., None] + np.asarray(g, float) * (1 - m[..., None])).astype(np.uint8)
Image.fromarray(out).save(O + "ff16x9_final.png"); print(O + "ff16x9_final.png")

# seam fix: per-row colour offset of the outpainted sides matched to the keeper strip at each seam, fading out over ~500 px
G = np.asarray(g, float).copy(); C = np.asarray(c, float); H = C.shape[0]
from scipy.ndimage import gaussian_filter1d
for side in ("L", "R"):
    if side == "L":
        d = C[:, x + 6:x + 26].mean(1) - G[:, x - 20:x].mean(1)
    else:
        d = C[:, x + w - 26:x + w - 6].mean(1) - G[:, x + w:x + w + 20].mean(1)
    d = gaussian_filter1d(d, 25, axis=0)
    cols = np.arange(c.width)
    dist = (x - cols) if side == "L" else (cols - (x + w - 1))
    wgt = np.clip(1 - dist / 500.0, 0, 1) * (dist >= -40)
    G += d[:, None, :] * wgt[None, :, None]
m2 = np.zeros((H, c.width), np.float32); f = 70
m2[:, x + f:x + w - f] = 1
for i in range(f): m2[:, x + i] = m2[:, x + w - 1 - i] = i / f
out = (C * m2[..., None] + G * (1 - m2[..., None])).clip(0, 255).astype(np.uint8)
Image.fromarray(out).save(O + "ff16x9_final.png"); print("seamfix", O + "ff16x9_final.png")
