"""Hang strips: the baked-in bar (top rows, outside the hands) gets one consistent dark-gray from the hero's palette."""
import sys, json, numpy as np
from PIL import Image
R = "/home/jade/Documents/vibesong/assets/sprites/"
meta = json.load(open(R + "sprites.json"))["sprites"]
for name in sys.argv[1:]:
    m = meta[name]; a = np.array(Image.open(R + m["file"]).convert("RGBA"))
    op = a[..., 3] > 0; cols = np.unique(a[op][:, :3], axis=0)
    grays = [c for c in cols if (c.max() - c.min()) < 25 and 40 < c.mean() < 130]
    g = min(grays, key=lambda c: abs(c.mean() - 75)) if grays else np.array([70, 70, 74])
    for y in range(0, 4):
        row = a[y]
        for x in range(a.shape[1]):
            if row[x, 3] == 0: continue
            c = row[x, :3].astype(int)
            skin = c[0] > 150 and c[0] - c[2] > 50 and c[1] > 90
            if not skin and c.sum() > 90: a[y, x, :3] = g
    Image.fromarray(a).save(R + m["file"]); print(name, "bar ->", g)
