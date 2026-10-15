"""v5 brows (procedural, smooth): on v4 pixels, per brow
  1) bottom trim ~10%: smooth new bottom curve = top + 0.9*(bottom-top); brow pixels below it are inpainted to skin;
  2) shape: smooth vertical displacement (cv2.remap) of a band around the brow so the TOP edge becomes
     a straight line (image-left brow, her right) or gets a slight arch (image-right brow, her left);
  3) light hair-stroke texture inside the brow mask only (thin slanted gaps, ragged lower edge)."""
import sys, numpy as np, cv2
from PIL import Image
from scipy import ndimage
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/sprites")
import v5_brows as B5

def tight_mask(a, P, grow=2):
    lum = a.mean(-1)
    hull = np.zeros(lum.shape, np.uint8); cv2.fillPoly(hull, [cv2.convexHull(P.astype(np.float32)).astype(np.int32)], 1)
    h = ndimage.binary_dilation(hull.astype(bool), iterations=grow)
    ring = ndimage.binary_dilation(hull.astype(bool), iterations=grow + 6)
    skin = np.percentile(lum[ring & ~h], 70); dark = np.percentile(lum[h], 8)
    m = h & (lum < skin - 0.45 * (skin - dark))
    m = ndimage.binary_opening(m, iterations=1)
    lab, n = ndimage.label(m)
    if n == 0: return None, None
    sizes = ndimage.sum(m, lab, range(1, n + 1)); keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > sizes.max() * 0.15])
    return keep, skin

def curves(M):
    ys, xs = np.nonzero(M); x0, x1 = xs.min(), xs.max()
    X = np.arange(x0, x1 + 1); top = np.full(len(X), np.nan); bot = np.full(len(X), np.nan)
    for i, x in enumerate(X):
        c = ys[xs == x]
        if len(c): top[i], bot[i] = c.min(), c.max()
    ok = ~np.isnan(top)
    top = np.interp(X, X[ok], top[ok]); bot = np.interp(X, X[ok], bot[ok])
    s = max(1.5, len(X) / 25)
    return X, ndimage.gaussian_filter1d(top, s), ndimage.gaussian_filter1d(bot, s)

def process(a, P, straight, inner_is_right, rng, trim=0.10, arch=0.045, feather=0.13):
    M, skin = tight_mask(a, P)
    if M is None: return a, "nomask"
    X, top, bot = curves(M)
    th = np.median(bot - top + 1)
    # 1) trim the bottom
    newbot = bot - trim * (bot - top + 1)
    cut = np.zeros(M.shape, bool)
    for i, x in enumerate(X):
        cut[int(np.ceil(newbot[i])) + 1:int(bot[i]) + 2, x] = True
    cut &= ndimage.binary_dilation(M, iterations=1)
    a8 = np.clip(a, 0, 255).astype(np.uint8)
    a = cv2.inpaint(a8, ndimage.binary_dilation(cut, iterations=1).astype(np.uint8) * 255, 3, cv2.INPAINT_TELEA).astype(np.float32)
    # 2) shape via smooth vertical displacement of the top edge
    L = X[-1] - X[0]
    lin = np.polyval(np.polyfit(X, top, 1), X)
    if straight:
        tgt = lin
    else:
        u = (X - X[0]) / max(L, 1); uu = 1 - u if inner_is_right else u
        bump = -arch * L * np.clip(np.where(uu < 0.66, uu / 0.66, (1 - uu) / 0.34), 0, 1)
        tgt = lin + np.minimum(top - lin, bump)
    dy = np.clip(tgt - top, -0.35 * th, 0.35 * th)              # + = move down
    dy = ndimage.gaussian_filter1d(dy, max(2, L / 15))
    H, W = a.shape[:2]
    y0 = int(top.min() - th * 1.2) - 2; y1 = int(newbot.max() + th * 1.2) + 2; xa = X[0] - 6; xb = X[-1] + 7
    gy, gx = np.mgrid[y0:y1, xa:xb].astype(np.float32)
    D = np.interp(gx[0], X, dy, left=0, right=0)
    # full displacement inside the brow band, fading to 0 at the band edges (vertical and at the brow ends)
    yc = np.interp(gx[0], X, (top + newbot) / 2); half = th * 1.2 + 2
    wy = np.clip(1 - np.abs(gy - yc[None]) / half, 0, 1) ** 0.7
    endfade = np.clip(np.minimum(gx[0] - xa, xb - gx[0]) / 6, 0, 1)
    disp = D[None] * wy * endfade[None]
    mapy = (gy - disp).astype(np.float32); mapx = gx.astype(np.float32)
    a[y0:y1, xa:xb] = cv2.remap(a, mapx, mapy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    # 3) hair-stroke texture inside the new brow
    M2, _ = tight_mask(a, P + np.c_[np.zeros(len(P)), np.interp(P[:, 0], X, dy)])
    if M2 is not None and feather > 0:
        ys, xs = np.nonzero(M2)
        u = (xs - X[0]) / max(L, 1); uu = 1 - u if inner_is_right else u
        ang = np.deg2rad(np.interp(uu, [0, 0.25, 1], [65, 35, 18]))
        sgn = -1 if inner_is_right else 1
        ph = (sgn * xs * np.sin(ang) + ys * np.cos(ang))
        per = max(2.2, th / 4)
        gap = (np.sin(ph / per * 2 * np.pi + rng.normal(0, 1.1, len(ys))) > 0.7)
        al = (gap * feather)[:, None]
        a[ys, xs] = a[ys, xs] * (1 - al) + skin * al
    return a, dict(len=int(L), thick=round(float(th), 1), trim=round(float(trim * th), 1), maxdy=round(float(np.abs(dy).max()), 1))

def run(src, dst, faces):
    a = np.array(Image.open(src).convert("RGB")).astype(np.float32); rng = np.random.default_rng(5)
    for box in faces:
        Lm = B5.landmarks(a, box)
        if Lm is None: print("   noface", box); continue
        PA, PB = Lm[B5.BROWS["A"]], Lm[B5.BROWS["B"]]
        left, right = (PA, PB) if PA[:, 0].mean() < PB[:, 0].mean() else (PB, PA)
        a, i1 = process(a, left, True, True, rng); a, i2 = process(a, right, False, False, rng)
        print("  ", box[:2], "L", i1, "R", i2)
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(dst)

if __name__ == "__main__":
    V = "/home/jade/Documents/vibesong/assets/sheets/"
    run(V + "paper/old_v4/paper_jade_turnaround.png", V + "raw/v5_turn.png", [(250, 140, 520, 420), (880, 140, 1160, 420)])
    run(V + "paper/old_v4/paper_expr_jade.png", V + "raw/v5_expr.png", [(c * 917, r * 768, c * 917 + 917, r * 768 + 768) for r in range(2) for c in range(3)])
    run(V + "paper/old_v4/paper_lineup.png", V + "raw/v5_lineup.png", [(450, 150, 700, 400)])
