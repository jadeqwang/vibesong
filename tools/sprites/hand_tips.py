"""Hair-down frames: pencils in Jade's hands. Blue-cap pencil gets a multicolour lead (2 px), pink-cap a graphite lead."""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
R = "/home/jade/Documents/vibesong/assets/sprites/"
YEL, BLUE, PINK = np.array([248, 168, 8]), np.array([16, 90, 236]), np.array([248, 80, 112])
RB1, RB2, GR, WD = [240, 64, 72], [70, 200, 96], [64, 62, 70], [232, 196, 150]
def near(a, c, t=90): return (np.abs(a[..., :3].astype(int) - c).sum(-1) < t) & (a[..., 3] > 0)
def fix(f):
    yel = near(f, YEL, 100); out = []
    for capc, cols in ((BLUE, (RB1, RB2)), (PINK, (GR, WD))):
        lab, n = ndimage.label(near(f, capc, 55))
        for k in range(1, n + 1):
            cap = lab == k
            if cap.sum() > 8: continue
            touch = ndimage.binary_dilation(cap, iterations=1, structure=np.ones((3, 3))) & yel
            if not touch.any(): continue
            yl, yn = ndimage.label(yel, structure=np.ones((3, 3)))
            ids = set(yl[touch]) - {0}
            body = np.isin(yl, list(ids))
            cy, cx = np.argwhere(cap).mean(0); ys, xs = np.nonzero(body)
            dist = np.hypot(ys - cy, xs - cx); order = np.argsort(-dist)
            if len(order) < 4 or dist.max() < 4: continue
            y0, x0 = ys[order[0]], xs[order[0]]
            # the lead pixel sits one step beyond the far end, if that pixel is free; else recolor the far end
            dy, dx = np.sign(y0 - cy), np.sign(x0 - cx)
            ty, tx = int(y0 + dy), int(x0 + dx)
            if 0 <= ty < f.shape[0] and 0 <= tx < f.shape[1] and not body[ty, tx]:
                f[ty, tx, :3] = cols[0]; f[ty, tx, 3] = 255; f[y0, x0, :3] = cols[1]
            else:
                f[y0, x0, :3] = cols[0]; y1, x1 = ys[order[1]], xs[order[1]]; f[y1, x1, :3] = cols[1]
            out.append(("blue" if capc is BLUE else "pink", (int(x0), int(y0))))
    return out
if __name__ == "__main__":
    meta = json.load(open(R + "sprites.json"))["sprites"]
    for arg in sys.argv[1:]:
        name, _, fr = arg.partition(":")
        m = meta[name]; w = m["frame_w"]; a = np.array(Image.open(R + m["file"]).convert("RGBA"))
        for k in ([int(v) for v in fr.split(",")] if fr else range(m["frames"])): print(name, k, fix(a[:, k * w:(k + 1) * w]))
        Image.fromarray(a).save(R + m["file"])
