"""Paint out stray model-drawn text (panel numbers, 'ah') on cream-paper sheets with the local paper colour."""
import numpy as np
from PIL import Image, ImageFilter
R = "/home/jade/Documents/vibesong/assets/sheets/"
def clean(src, dst, rects):
    im = Image.open(R + src).convert("RGB"); a = np.array(im).astype(float)
    for x0, y0, x1, y1 in rects:
        ring = np.concatenate([a[y0 - 12:y0, x0:x1].reshape(-1, 3), a[y1:y1 + 12, x0:x1].reshape(-1, 3),
                               a[y0:y1, x0 - 12:x0].reshape(-1, 3), a[y0:y1, x1:x1 + 12].reshape(-1, 3)])
        base = np.median(ring, 0)
        noise = np.random.default_rng(0).normal(0, 2.0, (y1 - y0, x1 - x0, 1))
        a[y0:y1, x0:x1] = base + noise
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(R + dst)
s = 2752 / 2000
num = []
for cx in (75, 735, 1390):
    for cy in (62, 632):
        num.append([int((cx - 42) * s), int((cy - 42) * s), int((cx + 42) * s), int((cy + 42) * s)])
clean("raw/paper_expr_ricky_t1.png", "paper/paper_expr_ricky.png", num)
clean("raw/paper_expr_charlie_t1.png", "paper/paper_expr_charlie_alt.png", [[int(1440 * s), int(282 * s), int(1500 * s), int(318 * s)]])
Image.open(R + "raw/paper_expr_jade_t2.png").convert("RGB").save(R + "paper/paper_expr_jade.png")
