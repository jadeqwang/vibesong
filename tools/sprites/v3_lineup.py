import sys; sys.path.insert(0, "/home/jade/Documents/vibesong/tools/sprites")
import numpy as np
from PIL import Image
from scipy import ndimage
from v3_paper import *
v1 = arr(V + "assets/sheets/raw/paper_lineup_nbp_t1.jpg"); ed = arr(V + "assets/sheets/raw/v3_lineup_nbp_a.png", (2752, 1536))
from PIL import ImageDraw
em = Image.new("L", (2752, 1536), 0); ImageDraw.Draw(em).ellipse((686, 462, 740, 545), fill=1)
keep = [headphone_mask(v1, (420, 300, 680, 460)), np.array(em).astype(bool)]
out, take = diff_composite(v1, ed, [(150, 0, 800, 1000, 342)], keep, thr=14)
# the edit made the epaulets/snap orange and the dot cyan: neutralise inside the shoulder band, recolor the dot
o = out; r, g, b = o[..., 0], o[..., 1], o[..., 2]
band = np.zeros(r.shape, bool); band[330:420, 150:800] = True
orange = band & take & (r > 170) & (r - b > 70)
lum = o.mean(-1)
shade = np.clip(lum / max(lum[orange].mean(), 1), 0.78, 1.06)[..., None]
white = np.array([243., 238., 228.]) * shade
al = ndimage.gaussian_filter(orange.astype(float), 0.8)[..., None]
o[:] = o * (1 - al) + np.clip(white, 0, 255) * al
cy = band.copy(); cy[330:470, 150:800] = True
cyan = cy & take & (b > 170) & (b - r > 40)
print("orange px", orange.sum(), "cyan px", cyan.sum())
PALE = np.array([150, 190, 236.])
al = ndimage.gaussian_filter(ndimage.binary_dilation(cyan, iterations=1).astype(float), 0.7)[..., None]
o[:] = o * (1 - al) + (PALE * np.clip(lum / lum[cyan].mean(), 0.85, 1.1)[..., None]) * al
out, info = thicken_brows(out, (450, 150, 700, 400), amount=0.95); print("brows", info)
img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).convert("RGBA")
import costume_comp as CC
from PIL import ImageFilter
def _flat(rgba, under):
    a = np.array(rgba).astype(float); a[..., :3] = np.clip(a[..., :3] - 4, 0, 255)
    return Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.45))
CC.pencilize = _flat
CC.patch(img, 713, 503.5, 40, 66)
img.convert("RGB").save(V + "assets/sheets/paper/paper_lineup.png")

Image.fromarray((take * 255).astype(np.uint8)).save("/tmp/claude-1000/-home-jade-Documents-vibesong/4a0ec359-ab98-423d-9be8-297e588f7098/scratchpad/take_l.png")
