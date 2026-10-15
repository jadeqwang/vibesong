"""k13c: voxel (k12) -> photoreal (k13) subdivision wavefront, swept in stroke order. Pure code, no model."""
import json, os, random, sys
import numpy as np
from PIL import Image, ImageFilter
import hz
from common import CONC, W as WK

W, H = 1920, 1080
A = np.asarray(Image.open(os.path.join(CONC, "k12_aerial_yibiyihua.png")).convert("RGB")).astype(np.float32)
B = np.asarray(Image.open(os.path.join(CONC, "k13_drop2_photoreal.png")).convert("RGB")).astype(np.float32)
F = float(sys.argv[1]) if len(sys.argv) > 1 else 0.5          # front position 0..1
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(CONC, "k13c_subdivision_mid.png")

# --- progress field: diagonal sweep, strokes pulled toward their global stroke order (一 → 笔 → 一 → 画)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
p = 0.78 * xx / W + 0.22 * yy / H
meta = json.load(open(os.path.join(WK, "layout", "k12.json")))
order = np.full((H, W), -1.0, np.float32)
tot = sum(hz.n_strokes(c) for c in "一笔一画"); k = 0
for ch, (x0, y0) in zip("一笔一画", meta["pos"]):
    S = meta["S"]
    for s in range(hz.n_strokes(ch)):
        m = np.asarray(hz.stroke_mask(ch, s, S).filter(ImageFilter.MaxFilter(9))) > 127
        ys, xs = np.nonzero(m)
        X, Y = xs + x0, ys + y0
        ok = (X >= 0) & (X < W) & (Y >= 0) & (Y < H)
        order[Y[ok], X[ok]] = k / (tot - 1)
        k += 1
ins = order >= 0
p = np.where(ins, 0.45 * p + 0.55 * (0.04 + 0.92 * order), p)
d = p - F

rnd = random.Random(7)
out = A.copy()
THR = {64: 0.025, 32: 0.0, 16: -0.02, 8: -0.04}   # subdivide below these (d units)
A_START = 0.055


def block(x, y, s):
    x1, y1 = min(x + s, W), min(y + s, H)
    c = B[y:y1, x:x1].reshape(-1, 3).mean(0)
    if s == 64:   # first split level still carries some of the voxel colour
        c = 0.5 * c + 0.5 * A[y:y1, x:x1].reshape(-1, 3).mean(0)
    out[y:y1, x:x1] = c
    bw = {64: 4, 32: 3, 16: 2, 8: 1}[s]
    hi, lo = np.clip(c * 1.28 + 10, 0, 255), c * 0.62
    out[y:y + bw, x:x1] = hi; out[y:y1, x:x + bw] = hi
    out[y1 - bw:y1, x:x1] = lo; out[y:y1, x1 - bw:x1] = lo


def cell(x, y, s):
    x1, y1 = min(x + s, W), min(y + s, H)
    dc = float(d[y:y1, x:x1].mean()) + rnd.uniform(-0.012, 0.012)
    if s == 64 and dc > A_START:
        return                                          # untouched voxel world ahead of the wave
    if dc < THR[s]:
        if s == 8:
            out[y:y1, x:x1] = B[y:y1, x:x1]             # fully resolved: photoreal
            return
        h = s // 2
        for oy in (0, h):
            for ox in (0, h):
                if x + ox < W and y + oy < H:
                    cell(x + ox, y + oy, h)
        return
    block(x, y, s)


for y in range(0, H, 64):
    for x in range(0, W, 64):
        cell(x, y, 64)

# thin bright seam where finest cells meet the photo (the LOD ramp edge)
img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
img.save(OUT)
print("saved", OUT)
