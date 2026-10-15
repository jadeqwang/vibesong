"""Hand-fix in code (v3): Jade's bun pencils go THROUGH the bun. Caps stick out on top (as drawn by the model), the crossing
is hidden inside the bun (hair colour), and each pencil's sharpened end pokes out on the opposite side:
blue-cap pencil -> 2-px multicolour (rainbow) lead, pink-cap pencil -> wood + dark graphite point.
fix_x2.py STRIP [--top=N] [--hide=R] [--ext=F]   (edits assets/sprites/STRIP.png in place)"""
import sys, json
import numpy as np
from PIL import Image
R = "/home/jade/Documents/vibesong/assets/sprites/"
YEL, BLUE, PINK = np.array([248, 168, 8]), np.array([16, 90, 236]), np.array([248, 80, 112])
WOOD, GRAPH, RB1, RB2 = [232, 196, 150], [64, 62, 70], [240, 64, 72], [70, 200, 96]

def near(a, c, t=90): return (np.abs(a[..., :3].astype(int) - c).sum(-1) < t) & (a[..., 3] > 0)

def raster(p0, p1):
    n = int(max(abs(p1[0] - p0[0]), abs(p1[1] - p0[1]))) + 1
    return [(int(round(p0[0] + (p1[0] - p0[0]) * t)), int(round(p0[1] + (p1[1] - p0[1]) * t))) for t in np.linspace(0, 1, n)]

def fix_frame_x(f, top, hide, notips=False):
    """The model already drew a full X over the bun: hide its middle (hair colour) so the pencils read as going
    through the bun, and give each far end its lead colour (blue-cap pencil -> rainbow, pink-cap -> graphite)."""
    reg = f[:top]
    yb, xb = np.nonzero(near(reg, BLUE)); yp, xp = np.nonzero(near(reg, PINK))
    yy, xy = np.nonzero(near(reg, YEL))
    if not len(yb) or not len(yp) or not len(yy): return "missing"
    B = np.array([xb.mean(), yb.mean()]); P = np.array([xp.mean(), yp.mean()])
    C = np.array([xy.mean(), yy.mean()])
    dark = (f[:top, :, :3].astype(int).sum(-1) < 200) & (f[:top, :, 3] > 0)
    hy, hx = np.nonzero(dark); hair = np.median(f[:top][hy, hx][:, :3], 0)
    for y, x in zip(yy, xy):
        if np.hypot(x - C[0], y - C[1]) <= hide: f[y, x, :3] = hair
    yy, xy = np.nonzero(near(f[:top], YEL))
    if notips:   # Jade: tips poking out in front of the hairline read as a hairclip -> only caps + bodies above the bun
        lead = near(f[:top], YEL)
        ly, lx = np.nonzero(lead)
        for y, x in zip(ly, lx):
            if y > C[1] + 1: f[y, x, :3] = hair
        return "x-mode notips C=%s" % C.round(1)
    for cap, cols in ((B, (RB1, RB2)), (P, (GRAPH, WOOD))):
        u = (C - cap) / np.linalg.norm(C - cap)
        cand = [(np.dot([x, y] - C, u), x, y) for y, x in zip(yy, xy) if np.dot([x, y] - C, u) > 0
                and abs(u[0] * (y - C[1]) - u[1] * (x - C[0])) < 2.2]
        if not cand: continue
        cand.sort(reverse=True)
        _, x, y = cand[0]; f[y, x, :3] = cols[0]
        if len(cand) > 1: _, x2, y2 = cand[1]; f[y2, x2, :3] = cols[1]
    return "x-mode C=%s" % C.round(1)

def fix_frame(f, top, hide, ext):
    reg = f[:top]
    yb, xb = np.nonzero(near(reg, BLUE)); yp, xp = np.nonzero(near(reg, PINK))
    if not len(yb) or not len(yp): return "no caps"
    kb = yb <= yb.min() + 2; kp = yp <= yp.min() + 2
    B = np.array([xb[kb].mean(), yb[kb].mean()]); P = np.array([xp[kp].mean(), yp[kp].mean()])
    yy, xy = np.nonzero(near(reg, YEL))
    keep = (xy >= min(B[0], P[0]) - 1) & (xy <= max(B[0], P[0]) + 1) & (yy <= max(B[1], P[1]) + 8)
    yy, xy = yy[keep], xy[keep]
    if not len(yy): return "no yellow"
    # crossing: the lowest point of the yellow V between the caps (or below it if the model drew them apart)
    low = yy.max(); C = np.array([xy[yy >= low - 1].mean(), float(low)])
    dark = (f[..., :3].astype(int).sum(-1) < 200) & (f[..., 3] > 0)
    hy, hx = np.nonzero(dark[max(int(C[1]) - 4, 0):int(C[1]) + 5, max(int(C[0]) - 4, 0):int(C[0]) + 5])
    hair = np.median(f[max(int(C[1]) - 4, 0):int(C[1]) + 5, max(int(C[0]) - 4, 0):int(C[0]) + 5][hy, hx][:, :3], 0) if len(hy) else np.array([30, 28, 34])
    # 1) hide the crossing: every pencil pixel within `hide` of C becomes hair
    pen = near(f, YEL) | near(f, np.array([240, 220, 150]), 80)
    ys, xs = np.nonzero(pen[:top])
    for y, x in zip(ys, xs):
        if np.hypot(x - C[0], y - C[1]) <= hide: f[y, x, :3] = hair; f[y, x, 3] = 255
    # 2) tips: continue each pencil past the crossing; it stays hidden while it is inside the hair/head and only
    #    shows where it exits the sprite silhouette (true occlusion): 1 px body + lead (rainbow / graphite)
    shown = []
    for cap, lead in ((B, "rainbow"), (P, "graphite")):
        d = C - cap; u = d / np.linalg.norm(d)
        pts = raster(C, C + u * 12); outside = []
        for x, y in pts[1:]:
            if not (0 <= y < f.shape[0] and 0 <= x < f.shape[1]): break
            if f[y, x, 3] == 0: outside.append((x, y))
            elif outside: break
            if len(outside) >= 3: break
        if not outside: shown.append(0); continue
        cols = [YEL, RB2, RB1] if lead == "rainbow" else [YEL, WOOD, GRAPH]
        cols = cols[-len(outside):] if len(outside) < 3 else cols
        for (x, y), col in zip(outside, cols):
            f[y, x, :3] = col; f[y, x, 3] = 255
        shown.append(len(outside))
    return "ok C=%s tips=%s" % (C.round(1), shown)

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    opt = dict(a[2:].split("=") for a in sys.argv[1:] if a.startswith("--"))
    meta = json.load(open(R + "sprites.json"))["sprites"]
    name = args[0]; m = meta[name]; w = m["frame_w"]
    a = np.array(Image.open(R + m["file"]).convert("RGBA"))
    only = [int(v) for v in opt["frames"].split(",")] if "frames" in opt else range(m["frames"])
    for k in only:
        fr = a[:, k * w:(k + 1) * w]
        if "x" in opt: print(name, k, fix_frame_x(fr, int(opt.get("top", 16)), float(opt.get("hide", 1.6)), "notips" in opt))
        else: print(name, k, fix_frame(fr, int(opt.get("top", 16)), float(opt.get("hide", 1.6)), float(opt.get("ext", 0.55))))
    Image.fromarray(a).save(R + m["file"])
