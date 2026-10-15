"""Figure-only restore for the 16:9 outpaint: keeper pixels on her figure (row-filled edge mask, dilated + feathered), the
model's outpaint for all the sky, so there is no strip seam."""
import numpy as np
from PIL import Image
from scipy import ndimage as nd
O = "media/cutscenes/_work/r720/"
x, w = map(int, open(O + "geom.txt").read().split())
C = np.asarray(Image.open(O + "canvas16x9.png").convert("RGB"), float)
G = np.asarray(Image.open(O + "outpaint_raw.png").convert("RGB").resize((C.shape[1], C.shape[0]), Image.LANCZOS), float)
gray = C.mean(2); H, W = gray.shape
ed = np.hypot(nd.sobel(gray, 0), nd.sobel(gray, 1))
fig = np.zeros_like(gray, bool); S = slice(x + 8, x + w - 8)
fig[:, S] = (ed[:, S] > 60) | (gray[:, S] < 110)
fig = nd.binary_opening(fig, iterations=1)
fill = np.zeros_like(fig)
for y in range(H):
    idx = np.nonzero(fig[y])[0]
    if len(idx) > 3: fill[y, idx[0]:idx[-1] + 1] = True
fill = nd.binary_closing(fill, iterations=8)
fill = nd.binary_dilation(fill, iterations=24)
m = nd.gaussian_filter(fill.astype(float), 14)
m[:, :x] = 0; m[:, x + w:] = 0
edge = np.zeros(W); edge[x:x + w] = 1; edge = nd.gaussian_filter1d(edge, 10)
m = np.minimum(m, edge[None, :] * 1.0)
out = (C * m[..., None] + G * (1 - m[..., None])).clip(0, 255).astype(np.uint8)
Image.fromarray(out).save(O + "ff16x9_final.png"); Image.fromarray((m * 255).astype(np.uint8)).save(O + "mask.png"); print("ok")

# the model kept the strip's own sky and painted the sides a different tone: shift the sides' colour per row toward the
# strip at each seam (sky rows only: rows where the figure reaches the seam are left alone), fading out over 700 px
G2 = G.copy(); cols = np.arange(W)
for side in ("L", "R"):
    if side == "L":
        d = G[:, x + 4:x + 24].mean(1) - G[:, x - 24:x - 4].mean(1); sky = 1 - m[:, x + 14]
        dist = x - cols
    else:
        d = G[:, x + w - 24:x + w - 4].mean(1) - G[:, x + w + 4:x + w + 24].mean(1); sky = 1 - m[:, x + w - 14]
        dist = cols - (x + w)
    d = nd.gaussian_filter1d(d * sky[:, None], 30, axis=0)
    wgt = np.clip(1 - dist / 700.0, 0, 1) * (dist >= 0)
    G2 += d[:, None, :] * wgt[None, :, None]
# blend across the seam itself (±12 px) to hide the line
for xs in (x, x + w):
    for i in range(-12, 13):
        a = (i + 12) / 24.0
        G2[:, xs + i] = G2[:, xs - 13] * (1 - a) + G2[:, xs + 13] * a if False else G2[:, xs + i]
out = (C * m[..., None] + G2 * (1 - m[..., None])).clip(0, 255).astype(np.uint8)
Image.fromarray(out).save(O + "ff16x9_final.png"); print("seam-harmonised")
