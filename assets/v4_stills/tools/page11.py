#!/usr/bin/env python3
"""#11 layout: the colored jam drawing (work/s11_c.png, NBP) placed on the page at the SAME position/scale as the graphite
drawing of #1 (work/s01_a.png, aligned on Charlie's cap + the desk), by multiplying the white-normalised drawing onto a
clean paper plate (paper colour + grain sampled from the empty top-left of #1).
usage: page11.py SCALE OX OY  -> work/s11_page.png (2752x1536)"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
R = '/home/jade/Documents/vibesong/assets/v4_stills/work/'
sc, ox, oy = float(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3])
A = np.asarray(Image.open(R + 's01_a.png').convert('RGB'), np.float32); H, W = A.shape[:2]
patch = A[40:440, 40:740]
base = np.median(patch.reshape(-1, 3), 0)
g = patch - ndimage.gaussian_filter(patch, (6, 6, 0))
t = np.concatenate([g, g[:, ::-1]], 1); t = np.concatenate([t, t[::-1]], 0)
G = np.tile(t, (H // t.shape[0] + 1, W // t.shape[1] + 1, 1))[:H, :W]
yy, xx = np.mgrid[0:H, 0:W]; vig = 1 - 0.05 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
paper = np.clip(base[None, None] * vig[..., None] + G, 0, 255)

D = np.asarray(Image.open(R + 's11_c.png').convert('RGB'), np.float32)
pc = np.percentile(D[60:400, 60:600].reshape(-1, 3), 80, axis=0)          # 11c's paper colour (empty top-left)
Dn = np.clip(D / pc[None, None], 0, 1)
w = np.zeros(D.shape[:2], np.float32); w[60:1505, 120:2420] = 1             # drawing area only (drops 11c's page edge)
w[1395:, :830] = 0                                                          # the model's glitch rectangle (bottom-left)
w = ndimage.gaussian_filter(w, 45)
Dn = 1 - w[..., None] * (1 - Dn)
d = np.asarray(Image.fromarray((Dn * 255).astype(np.uint8)).resize((int(D.shape[1] * sc), int(D.shape[0] * sc)), Image.LANCZOS), np.float32) / 255
layer = np.ones_like(A); x, y = int(ox), int(oy)
x0, y0 = max(0, x), max(0, y); x1, y1 = min(W, x + d.shape[1]), min(H, y + d.shape[0])
layer[y0:y1, x0:x1] = d[y0 - y:y1 - y, x0 - x:x1 - x]
out = np.clip(paper * layer, 0, 255).astype(np.uint8)
Image.fromarray(out).save(R + 's11_page.png')
Image.fromarray(out).resize((1376, 768)).save('/tmp/claude-1000/-home-jade-Documents-vibesong/a3fe6b6f-cc3f-4c69-9917-9f0d3f1e837a/scratchpad/p11.jpg')
