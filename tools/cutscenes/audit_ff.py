"""Audit a first frame against its v9 canvas: per-region pixel change + side-by-side face crop and a 3x crop of the figure."""
import sys, numpy as np
from PIL import Image, ImageDraw
O = "media/cutscenes/_work/ff/"
v, f = sys.argv[1], sys.argv[2]
c = Image.open(O + f"canvas_{v}.png").convert("RGB"); g = Image.open(O + f).convert("RGB").resize(c.size, Image.LANCZOS)
A, B = np.asarray(c).astype(float), np.asarray(g).astype(float)
face = (1050, 280, 1700, 760)   # forehead..chin box in canvas coords
for name, (x0, y0, x1, y1) in {"face": face, "hair+bun": (980, 60, 1780, 420), "headphones": (1200, 700, 1560, 980)}.items():
    d = np.abs(A[y0:y1, x0:x1] - B[y0:y1, x0:x1]).mean()
    print(f"{name:10s} mean abs diff {d:5.1f}")
# side by side face crop (v9 | frame)
fc = [im.crop(face).resize((650 * 1, 480 * 1)) for im in (c, g)]
sb = Image.new("RGB", (1310, 500), "white"); sb.paste(fc[0], (0, 20)); sb.paste(fc[1], (660, 20))
d = ImageDraw.Draw(sb); d.text((10, 2), "v9 sheet", fill="black"); d.text((670, 2), f, fill="black")
sb.save(O + f"audit_{f[:-4]}_face.jpg", quality=92)
# 3x crop of the figure (head + pencils + headphones + jacket), downscaled-out at 3x of a 960-wide view
fig = g.crop((700, 0, 2052, 1536)); fig.save(O + f"audit_{f[:-4]}_fig.jpg", quality=92)
