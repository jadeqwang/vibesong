"""Hand-fix: yellow pencils in Jade's hands on the hair-down back strips (right hand = image-right: blue cap; left: pink cap)."""
import json, numpy as np
from PIL import Image
from scipy import ndimage
R = "/home/jade/Documents/vibesong/assets/sprites/"
YEL, YELD, BLUE, PINK, OL = [248, 184, 40], [200, 130, 20], [40, 104, 216], [240, 100, 140], [20, 16, 20]
def is_skin(c): return c[0] > 180 and c[2] < 170 and c[1] > 110
for name in ["jade_back_hairdown", "jade_back_hairdown_run"]:
    a = np.array(Image.open(R + name + ".png").convert("RGBA")); n = a.shape[1] // 36
    for k in range(n):
        f = a[:, k * 36:(k + 1) * 36]
        for side in ("L", "R"):
            xs_range = range(0, 13) if side == "L" else range(23, 36)
            pts = [(y, x) for y in range(24, 33) for x in xs_range if f[y, x, 3] and is_skin(f[y, x, :3])]
            if not pts: print(name, k, side, "no hand"); continue
            # hand = the outermost skin cluster
            hy, hx = (max(pts, key=lambda p: -p[1]) if side == "L" else max(pts, key=lambda p: p[1]))
            # clear old dark pencil pixels outside the body column beyond the hand
            for y in range(hy - 1, min(hy + 6, 44)):
                for x in (range(0, hx) if side == "L" else range(hx + 1, 36)):
                    if f[y, x, 3] and f[y, x, :3].astype(int).sum() < 200 and not (9 <= x <= 27 and y >= 30):
                        f[y, x] = 0
            # pencil: from the hand, 3 px diagonally down-outward, cap at the end
            dx = -1 if side == "L" else 1
            body = [(hy + 1 + i, hx + dx * (i + 1)) for i in range(3)]
            cap = (hy + 4, hx + dx * 4)
            for y, x in body: f[y, x] = YEL + [255]
            f[cap[0], cap[1]] = (PINK if side == "L" else BLUE) + [255]
            # outline the new pixels where they touch transparency
            new = np.zeros(f.shape[:2], bool)
            for y, x in body + [cap]: new[y, x] = True
            ring = ndimage.binary_dilation(new, structure=np.ones((3, 3))) & ~new & (f[..., 3] == 0)
            f[ring] = OL + [255]
    Image.fromarray(a).save(R + name + ".png"); print(name, "ok")
