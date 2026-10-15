"""Pencil canon fixes on paper drawings: recolor a cap (pink -> blue) and give the blue pencil's visible tip a rainbow core."""
import numpy as np
from PIL import Image
from scipy import ndimage
RAINBOW = np.array([[226, 60, 64], [246, 170, 40], [250, 222, 70], [90, 186, 90], [70, 130, 225], [150, 90, 200]], float)
BLUE_CAP = np.array([95, 140, 215], float)

def recolor_cap(a, box, src="pink"):
    x0, y0, x1, y1 = box; s = a[y0:y1, x0:x1].astype(float)
    r, g, b = s[..., 0], s[..., 1], s[..., 2]
    m = (r > 180) & (r - g > 35) & (b > 110)          # pink eraser
    m = ndimage.binary_closing(m, iterations=1)
    lum = s.mean(-1); ref = lum[m].mean()
    new = np.clip(BLUE_CAP[None, None] * (lum / ref)[..., None] ** 1.0, 0, 255)
    al = ndimage.gaussian_filter(m.astype(float), 0.6)[..., None]
    a[y0:y1, x0:x1] = s * (1 - al) + new * al
    return int(m.sum())

def rainbow_tip(a, p0, d, length=40, half_w=6, core_from=0.45):
    """From p0 (end of the yellow body) walk along unit dir d; recolor the dark graphite point with rainbow stripes
    (assigned by perpendicular offset) and draw a thin rainbow core into the cut wood cone."""
    d = np.array(d, float); d /= np.linalg.norm(d); n = np.array([-d[1], d[0]])
    ys, xs = np.mgrid[int(p0[1]) - length - 8:int(p0[1]) + length + 8, int(p0[0]) - length - 8:int(p0[0]) + length + 8]
    rel = np.stack([xs - p0[0], ys - p0[1]], -1).astype(float)
    t = rel @ d; u = rel @ n
    band = (t > 0) & (t < length) & (np.abs(u) < half_w)
    yy, xx = ys[band], xs[band]; tt, uu = t[band], u[band]
    px = a[yy, xx].astype(float); lum = px.mean(-1); sat = px.max(-1) - px.min(-1)
    wood = (lum >= 140) & (sat < 110) & (px[:, 0] > px[:, 2] + 10) & (np.abs(uu) < half_w * 0.8)
    if not wood.any(): return 0
    tw = np.percentile(tt[wood], 97)
    point = (lum < 150) & (sat < 70) & (tt > tw - 3) & (tt < tw + 8) & (np.abs(uu) < 3.2 - np.clip(tt - tw, 0, 8) * 0.3)
    if not point.any(): return 0
    tmax = tt[point].max(); tmin = tt[point].min()
    # stripes across the lead
    k = np.clip(((uu + half_w * 0.6) / (half_w * 1.2) * len(RAINBOW)).astype(int), 0, len(RAINBOW) - 1)
    shade = np.clip(lum / 110, 0.55, 1.1)[:, None]
    newp = RAINBOW[k] * shade
    sel = point
    a[yy[sel], xx[sel]] = px[sel] * 0.15 + newp[sel] * 0.85
    # core line into the cone (just behind the point): |u| < 1.3
    core = wood & (tt > tmin - (tmax - tmin) * 0.9) & (tt < tmin + 1) & (np.abs(uu) < 1.4)
    a[yy[core], xx[core]] = px[core] * 0.35 + RAINBOW[k[core]] * 0.65
    return int(sel.sum())

def auto_tip(a, near, d, r=70, length=60, half_w=8):
    """Find the yellow pencil body near `near`; start the rainbow search at its far end along d."""
    x, y = near; s = a[y - r:y + r, x - r:x + r].astype(int)
    yel = (s[..., 0] > 190) & (s[..., 1] > 130) & (s[..., 2] < 120) & (s[..., 0] - s[..., 2] > 100)
    ys, xs = np.nonzero(yel)
    if not len(ys): return 0
    d = np.array(d, float); d /= np.linalg.norm(d)
    t = xs * d[0] + ys * d[1]; k = np.argmax(t)
    p0 = (xs[k] + x - r - d[0] * 3, ys[k] + y - r - d[1] * 3)
    return rainbow_tip(a, p0, d, length=length, half_w=half_w)

def paint_rainbow_point(a, near, d, r=80, verbose=True):
    """Recolor the graphite fill of the sharpened point (of the pencil whose yellow body is near `near`) with rainbow
    stripes and add a thin rainbow core into the cut cone. Direction from PCA of the yellow body (d only picks the sign)."""
    x, y = near; s = a[y - r:y + r, x - r:x + r].astype(float)
    yel = (s[..., 0] > 190) & (s[..., 1] > 130) & (s[..., 2] < 120) & (s[..., 0] - s[..., 2] > 100)
    yel = ndimage.binary_closing(yel, iterations=2)
    lab, n = ndimage.label(yel)
    if n == 0: return 0
    k = np.argmax(ndimage.sum(yel, lab, range(1, n + 1))) + 1
    ys, xs = np.nonzero(lab == k); P = np.c_[xs, ys].astype(float) + [x - r, y - r]
    c = P.mean(0); dd = np.linalg.svd(P - c, full_matrices=False)[2][0]
    if dd @ np.array(d) < 0: dd = -dd
    nn = np.array([-dd[1], dd[0]])
    t = (P - c) @ dd; C0 = c + dd * t.max(); hw = (np.percentile((P - c) @ nn, 97) - np.percentile((P - c) @ nn, 3)) / 2 + 0.5
    yy, xx = np.mgrid[int(C0[1]) - 95:int(C0[1]) + 95, int(C0[0]) - 95:int(C0[0]) + 95]
    rel = np.stack([xx - C0[0], yy - C0[1]], -1); T = rel @ dd; U = rel @ nn
    px = a[yy, xx]; L = px.mean(-1); sat = px.max(-1) - px.min(-1)
    graph = (T > 2) & (T < 90) & (np.abs(U) < hw + 1.0) & (L > 45) & (L < 175) & (sat < 45)
    lab2, n2 = ndimage.label(graph)
    if n2 == 0: return 0
    k2 = np.argmax(ndimage.sum(graph, lab2, range(1, n2 + 1))) + 1; point = lab2 == k2
    t0, t1 = T[point].min(), T[point].max(); Lc = t1
    wcone = np.clip(hw * (t1 - T) / max(t1, 1), 0.8, None)
    U0 = np.median(U[point]); Ur = max(np.percentile(np.abs(U[point] - U0), 90), 1.0)
    kk = np.clip((((U - U0) / Ur + 1) / 2 * len(RAINBOW)).astype(int), 0, len(RAINBOW) - 1)
    U = U - U0
    core = (T > t0 - (t1 - t0) * 1.1) & (T <= t0 + 0.5) & (np.abs(U) < 0.9) & (sat >= 30) & (L > 120)
    shade = np.clip(L / 120, 0.6, 1.1)[..., None]
    a[yy[point], xx[point]] = px[point] * 0.12 + (RAINBOW[kk] * shade)[point] * 0.88
    a[yy[core], xx[core]] = px[core] * 0.35 + RAINBOW[kk[core]] * 0.65
    if verbose: print("   point px", int(point.sum()), "Lc", Lc, "hw", round(hw, 1), "dir", dd.round(2))
    return int(point.sum())

def paint_point(a, apex, d, Lp, wb, core=8, ss=4):
    """Paint a rainbow lead point: apex at `apex`, pencil pointing along d (towards the apex), length Lp, base half-width wb."""
    d = np.array(d, float); d /= np.linalg.norm(d); n = np.array([-d[1], d[0]])
    R = int(Lp + core + wb + 4); ax, ay = apex
    ys, xs = np.mgrid[int(ay) - R:int(ay) + R, int(ax) - R:int(ax) + R]
    acc = np.zeros(ys.shape + (3,)); cov = np.zeros(ys.shape); line = np.zeros(ys.shape)
    for sy in range(ss):
        for sx in range(ss):
            px = xs + (sx + 0.5) / ss - 0.5 - ax; py = ys + (sy + 0.5) / ss - 0.5 - ay
            T = -(px * d[0] + py * d[1]); U = px * n[0] + py * n[1]
            w = wb * np.clip(T / Lp, 0, 1)
            inside = (T >= 0) & (T <= Lp) & (np.abs(U) <= w)
            k = np.clip(((U / np.maximum(w, 0.3) + 1) / 2 * len(RAINBOW)).astype(int), 0, len(RAINBOW) - 1)
            acc += RAINBOW[k] * inside[..., None]; cov += inside
            line += inside & (np.abs(U) > w - 0.8)
    cov /= ss * ss; line /= ss * ss
    col = acc / np.maximum(cov * ss * ss, 1e-6)[..., None]
    reg = a[ys, xs].astype(float)
    out = reg * (1 - cov[..., None] * 0.92) + col * cov[..., None] * 0.92
    out = out * (1 - line[..., None] * 0.7) + np.array([45, 38, 36]) * line[..., None] * 0.7
    # rainbow core line back into the wood cone
    px = xs - ax; py = ys - ay; T = -(px * d[0] + py * d[1]); U = px * n[0] + py * n[1]
    wood = (reg[..., 0] - reg[..., 2] < 120) & (reg.mean(-1) > 120) & (reg[..., 0] - reg[..., 2] > 25)
    cm = (T > Lp - 1) & (T < Lp + core) & (np.abs(U) < 0.85) & wood
    kk = (np.clip((T - Lp) / core, 0, 0.999) * len(RAINBOW)).astype(int)
    out[cm] = out[cm] * 0.35 + RAINBOW[kk[cm]] * 0.65
    a[ys, xs] = out
