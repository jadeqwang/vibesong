"""Hand-fix in code: at sprite size the model draws Jade's bun pencils as a V. Extend both pencils through the crossing
point so their sharpened ends poke out on the opposite sides: a readable X (yellow bodies, blue + pink caps kept).
fix_x.py STRIP [frame ...] (default: all frames); edits assets/sprites/STRIP.png in place."""
import sys, json
import numpy as np
from PIL import Image
R = "/home/jade/Documents/vibesong/assets/sprites/"
YEL, BLUE, PINK = np.array([248, 168, 8]), np.array([16, 90, 236]), np.array([248, 80, 112])
TIP = np.array([60, 52, 50])

def near(a, c, t=60): return (np.abs(a[..., :3].astype(int) - c).sum(-1) < t) & (a[..., 3] > 0)

def line(p0, p1):
    n = int(max(abs(p1[0] - p0[0]), abs(p1[1] - p0[1]))) + 1
    return [(int(round(p0[0] + (p1[0] - p0[0]) * t)), int(round(p0[1] + (p1[1] - p0[1]) * t))) for t in np.linspace(0, 1, n)]

def fix_frame(f, top=None, ext=0.75):
    h = top or f.shape[0] // 2
    reg = f[:h]
    yb, xb = np.nonzero(near(reg, BLUE, 90)); yp, xp = np.nonzero(near(reg, PINK, 90)); yy, xy = np.nonzero(near(reg, YEL, 90))
    if not len(yb) or not len(yp) or not len(yy): return False
    kb = yb <= yb.min() + 2; yb, xb = yb[kb], xb[kb]          # the caps are the topmost blobs; ignore skin/stripe look-alikes
    kp = yp <= yp.min() + 2; yp, xp = yp[kp], xp[kp]
    B = np.array([xb.mean(), yb.mean()]); P = np.array([xp.mean(), yp.mean()])
    keep = (xy >= min(B[0], P[0]) - 1) & (xy <= max(B[0], P[0]) + 1) & (yy <= max(B[1], P[1]) + 6)
    yy, xy = yy[keep], xy[keep]
    if not len(yy): return False
    low = yy.max(); C = np.array([xy[yy >= low - 1].mean(), float(low)])   # bottom of the V = crossing point
    for cap in (B, P):
        d = C - cap; end = C + d * ext
        pts = line(C, end)
        for k, (x, y) in enumerate(pts[1:]):
            if not (0 <= y < f.shape[0] and 0 <= x < f.shape[1]): continue
            f[y, x, :3] = TIP if k == len(pts) - 2 else YEL; f[y, x, 3] = 255
        x, y = pts[-1]   # outline the poking tip on its outer side
    return True

if __name__ == "__main__":
    meta = json.load(open(R + "sprites.json"))["sprites"]
    name = sys.argv[1]; m = meta[name]; w = m["frame_w"]
    a = np.array(Image.open(R + m["file"]).convert("RGBA"))
    frames = [int(v) for v in sys.argv[2:]] or range(m["frames"])
    for k in frames:
        ok = fix_frame(a[:, k * w:(k + 1) * w], top=16)
        print(name, k, "fixed" if ok else "no pencils found")
    Image.fromarray(a).save(R + m["file"])
