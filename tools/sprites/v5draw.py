"""v5 brows: erase each v4 brow (inpaint) and REDRAW it procedurally with feathery pencil hair-strokes.
Geometry comes from the v4 brow: same top edge (anchored), thickness x0.90 (trimmed from the bottom),
image-left brow (her right) = straight top line, image-right brow (her left) = slight arch."""
import sys, numpy as np, cv2
from PIL import Image, ImageDraw
from scipy import ndimage
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/sprites")
import v5_brows as B5

def brow_mask(a, P):
    lum = a.mean(-1)
    hull = np.zeros(lum.shape, np.uint8); cv2.fillPoly(hull, [cv2.convexHull(P.astype(np.float32)).astype(np.int32)], 1)
    th0 = np.ptp(P[:, 1]) + 2
    reg = ndimage.binary_dilation(hull.astype(bool), iterations=int(th0 * 0.6) + 3)
    vals = lum[reg]; skin = np.percentile(vals, 85); dark = np.percentile(vals, 5)
    m = reg & (lum < (skin + dark) / 2)
    lab, n = ndimage.label(m)
    if n == 0: return None
    # component overlapping the landmark hull most
    best = max(range(1, n + 1), key=lambda k: (hull.astype(bool) & (lab == k)).sum())
    return ndimage.binary_closing(lab == best, iterations=2), skin, dark

def geometry(M, inner_is_right):
    ys, xs = np.nonzero(M)
    x0, x1 = xs.min(), xs.max(); L = x1 - x0 + 1
    nb = max(8, L // 3); edges = np.linspace(x0, x1 + 1, nb + 1)
    cx, top, bot = [], [], []
    for i in range(nb):
        sel = (xs >= edges[i]) & (xs < edges[i + 1])
        if sel.sum() < 2: continue
        cx.append((edges[i] + edges[i + 1]) / 2); top.append(np.percentile(ys[sel], 5)); bot.append(np.percentile(ys[sel], 95))
    cx, top, bot = map(np.array, (cx, top, bot))
    return x0, x1, cx, top, bot

def draw_brow(base, M, straight, inner_is_right, color, rng, trim=0.90, arch=0.045, ss=4):
    x0, x1, cx, top, bot = geometry(M, inner_is_right)
    L = x1 - x0
    thick = np.clip(bot - top + 1, 2, None)
    # top line
    if straight:
        tl = np.polyval(np.polyfit(cx, top, 1), cx)
    else:
        lin = np.polyval(np.polyfit(cx, top, 1), cx)
        u = (cx - x0) / max(L, 1); uu = 1 - u if inner_is_right else u      # 0 at inner end
        bump = -arch * L * np.clip(np.where(uu < 0.66, uu / 0.66, (1 - uu) / 0.34), 0, 1)
        sm = ndimage.gaussian_filter1d(top, 1)
        tl = lin + np.minimum(sm - lin, bump)
    thk = ndimage.gaussian_filter1d(thick, 1) * trim
    # draw strokes at ss x
    H, W = base.shape[:2]
    pad = int(max(thk.max(), 6) * 2 + 6)
    bx0, by0 = int(x0 - pad), int(tl.min() - pad); bx1, by1 = int(x1 + pad), int((tl + thk).max() + pad)
    canvas = Image.new("L", ((bx1 - bx0) * ss, (by1 - by0) * ss), 0); d = ImageDraw.Draw(canvas)
    ftop = lambda x: np.interp(x, cx, tl); fth = lambda x: np.interp(x, cx, thk)
    n = int(L * thk.mean() / 1.6)
    for _ in range(n):
        x = rng.uniform(x0, x1)
        u = (x - x0) / max(L, 1); uu = 1 - u if inner_is_right else u      # 0 inner .. 1 tail
        t = ftop(x); th = fth(x) * (1 - 0.45 * max(0, uu - 0.6) / 0.4)    # taper toward the tail
        y = t + rng.uniform(0.15, 1.0) * th
        ang = np.deg2rad(np.interp(uu, [0, 0.25, 1], [68, 32, 14]) + rng.normal(0, 6))   # inner hairs upright, tail flat
        dirx = -1 if inner_is_right else 1                                  # hairs grow toward the tail
        ln = rng.uniform(0.7, 1.25) * max(th, 3) * (1.2 if uu < 0.25 else 1.0)
        xa, ya = x, y; xb, yb = x + dirx * np.cos(ang) * ln, y - np.sin(ang) * ln
        # keep inside the brow band (top anchored)
        yb = max(yb, ftop(xb) - 0.6)
        w = rng.uniform(0.55, 1.0) * ss
        val = int(rng.uniform(150, 255))
        d.line(((xa - bx0) * ss, (ya - by0) * ss, (xb - bx0) * ss, (yb - by0) * ss), fill=val, width=max(1, int(w)))
    cov = np.array(canvas.resize((bx1 - bx0, by1 - by0), Image.LANCZOS)).astype(np.float32) / 255
    cov = np.clip(cov * 1.25, 0, 0.95)[..., None]
    reg = base[by0:by1, bx0:bx1]
    base[by0:by1, bx0:bx1] = reg * (1 - cov) + color * cov
    return dict(len=int(L), thick=round(float(np.median(thick)), 1), new=round(float(np.median(thk)), 1))

def run(src, dst, faces, extra=()):
    a = np.array(Image.open(src).convert("RGB")).astype(np.float32); rng = np.random.default_rng(11); log = []
    for box in faces:
        Lm = B5.landmarks(a, box)
        if Lm is None: log.append(("noface", box)); continue
        PA, PB = Lm[B5.BROWS["A"]], Lm[B5.BROWS["B"]]
        left, right = (PA, PB) if PA[:, 0].mean() < PB[:, 0].mean() else (PB, PA)
        for P, straight, inner_right in ((left, True, True), (right, False, False)):
            r = brow_mask(a, P)
            if r is None: log.append("nomask"); continue
            M, skin, dark = r
            col = np.array([a[M][:, k][a[M].mean(-1) < np.percentile(a[M].mean(-1), 30)].mean() for k in range(3)])
            er = ndimage.binary_dilation(M, iterations=2).astype(np.uint8) * 255
            a = cv2.inpaint(np.clip(a, 0, 255).astype(np.uint8), er, 5, cv2.INPAINT_TELEA).astype(np.float32)
            log.append(draw_brow(a, M, straight, inner_right, col, rng))
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(dst)
    for l in log: print("  ", l)

if __name__ == "__main__":
    V = "/home/jade/Documents/vibesong/assets/sheets/"
    run(V + "paper/old_v4/paper_jade_turnaround.png", V + "raw/v5_turn.png", [(250, 140, 520, 420), (880, 140, 1160, 420)])
    run(V + "paper/old_v4/paper_expr_jade.png", V + "raw/v5_expr.png", [(c * 917, r * 768, c * 917 + 917, r * 768 + 768) for r in range(2) for c in range(3)])
    run(V + "paper/old_v4/paper_lineup.png", V + "raw/v5_lineup.png", [(450, 150, 700, 400)])
