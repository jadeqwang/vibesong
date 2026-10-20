"""v4.4 spread: the paper still under the living layer = media/act5/tex/spread_full_v11.jpg with the spreadR rect replaced by the
layer's frame at song 194.9 (the end of the 194.06-194.9 dissolve), so the layer dissolves into itself (no ghost).
    .venv/bin/python tools/cutscenes/pb_spread44_tex.py NAME LAG      -> media/act5/tex/spread_{full,half}_NAME.jpg"""
import sys, numpy as np
from PIL import Image
name, lag = sys.argv[1], float(sys.argv[2])
R = "/home/jade/Documents/vibesong/media/act5/"
k = min(270, round((194.9 - 186.30 + lag) * 30))
fr = Image.open(f"{R}frames/{name}/1080/f_{k:05d}.jpg").convert("RGB")
sp = Image.open(R + "tex/spread_full_v11.jpg").convert("RGB"); W, H = sp.size
x0, y0 = round(0.4440407 * W), round(0.2350260 * H); w, h = W - x0, round(0.5602214 * H)
fr = np.asarray(fr.resize((w, h), Image.LANCZOS)).astype(np.float32)
F = 40; r = lambda n: np.clip(np.arange(n) / F, 0, 1)
ax = np.minimum(r(w), np.ones(w)); ay = np.minimum(r(h), r(h)[::-1])        # no feather on the spread's right edge
a = (ax[None, :] * ay[:, None])[..., None]
out = np.asarray(sp).astype(np.float32).copy(); out[y0:y0 + h, x0:x0 + w] = out[y0:y0 + h, x0:x0 + w] * (1 - a) + fr * a
o = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
o.save(f"{R}tex/spread_full_{name}.jpg", quality=92); o.resize((W // 2, H // 2), Image.LANCZOS).save(f"{R}tex/spread_half_{name}.jpg", quality=92)
print("frame", k, "->", f"{R}tex/spread_full_{name}.jpg")
