"""v8 brows: start from v3's own (thin, coherent) brows and thicken each into ONE smooth shape.
v8  : ~2x thickness grown upward (bottom edge / brow-to-eye gap kept);  v8b: ~2x grown symmetrically.
Fill = hair mid-tone (v6A's colour) with subtle texture resampled from v3's own brow; 1-px AA edge; hair strands re-layered on top."""
import sys, numpy as np, cv2
from PIL import Image
from scipy import ndimage
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/sprites")
import v5_brows as B5, v6_brows as S6
V = "/home/jade/Documents/vibesong/assets/sheets/"
SS = 4
INNER_LEFT = [True]

def drawn_centerline(a, P, ew):
    """Landmarks follow the face, not the drawn (expressive) brow: find the drawn brow stroke near them and
    return points along its centreline."""
    lum = a.mean(-1)
    hull = np.zeros(lum.shape, np.uint8); cv2.fillPoly(hull, [cv2.convexHull(P.astype(np.float32)).astype(np.int32)], 1)
    reg = ndimage.binary_dilation(hull.astype(bool), iterations=int(ew * 0.45))
    vals = lum[reg]; sk = np.percentile(vals, 85)
    dark = reg & (lum < sk - 50)
    op = ndimage.binary_opening(dark, structure=np.ones((3, 5)))        # cut thin hair strands
    lab, n = ndimage.label(op)
    if n == 0: return P
    best, score = None, -1
    for k in range(1, n + 1):
        c = lab == k; ys, xs = np.nonzero(c)
        w, h = np.ptp(xs) + 1, np.ptp(ys) + 1
        if w < ew * 0.4 or c.sum() > ew * ew * 0.9: continue           # too short, or a hair mass
        sc = (c & ndimage.binary_dilation(hull.astype(bool), iterations=int(ew * 0.25))).sum() + w
        if sc > score: best, score = c, sc
    if best is None: return P
    ys, xs = np.nonzero(best)
    X = np.linspace(xs.min(), xs.max(), 10)
    Y = np.polyval(np.polyfit(xs, ys, 2), X)
    return np.c_[X, Y + np.r_[-1, 1, -1, 1, -1, 1, -1, 1, -1, 1] * 2]

def brow_profile(a, P, ew=None, lid_y=None):
    """2-D: the drawn brow stroke = strand-free core component near the landmarks (+ its own edge pixels);
    per-column top/bottom from that mask (median-filtered later)."""
    lum = a.mean(-1)
    hull = np.zeros(lum.shape, np.uint8); cv2.fillPoly(hull, [cv2.convexHull(P.astype(np.float32)).astype(np.int32)], 1)
    hullb = hull.astype(bool)
    reg = ndimage.binary_dilation(hullb, iterations=int(ew * 0.45))
    sk = np.percentile(lum[reg], 85)
    dark = reg & (lum < sk - 45)
    win = max(9, int(ew * 0.35)) | 1
    dens = cv2.blur((lum < sk - 45).astype(np.float32), (win, win))
    hairmass = (dens > 0.62) & (lum < 60)                       # thick dark hair areas (brows are thin strokes)
    core = ndimage.binary_opening(dark & ~hairmass, structure=np.ones((2, 4)))
    lab, n = ndimage.label(core)
    best, score = None, -1
    near = ndimage.binary_dilation(hullb, iterations=int(ew * 0.3))
    for k in range(1, n + 1):
        c = lab == k; ys, xs = np.nonzero(c); w = np.ptp(xs) + 1; h = np.ptp(ys) + 1
        if w < ew * 0.3 or h > w * 0.8 or c.sum() > ew * ew * 0.5: continue
        if lid_y is not None and ys.mean() > lid_y - 0.12 * ew: continue      # that's the eyelid line
        sc = (c & near).sum() * 2 + w
        if sc > score: best, score = c, sc
    if best is None: return None
    M = ndimage.binary_dilation(best, iterations=1) & dark & ~hairmass
    M = ndimage.binary_fill_holes(ndimage.binary_closing(M, iterations=2))
    ys, xs = np.nonzero(M); X = np.arange(xs.min(), xs.max() + 1)
    T = np.array([ys[xs == x].min() if (xs == x).any() else np.nan for x in X], float)
    Bo = np.array([ys[xs == x].max() if (xs == x).any() else np.nan for x in X], float)
    ok = ~np.isnan(T); T = np.interp(X, X[ok], T[ok]); Bo = np.interp(X, X[ok], Bo[ok])
    strandcols = set()
    for x, t, b in zip(X, T.astype(int), Bo.astype(int)):
        if lum[max(t - 3, 0), x] < sk - 45 or lum[min(b + 3, lum.shape[0] - 1), x] < sk - 45: strandcols.add(x)
    return X, T, Bo, strandcols, sk

def brow_profile_old(a, P, ew=None):
    """Per-column top/bottom of the v3 brow along the drawn brow line; strand columns are interpolated."""
    if ew is not None: P = drawn_centerline(a, P, ew)
    cols = B5.brow_columns(a, P)
    lum = a.mean(-1)
    good = {}
    for x, (t, b, sk) in cols.items():
        strand = lum[max(t - 3, 0), x] < sk - 45 or lum[b + 3, x] < sk - 45
        good[x] = (t, b, sk, strand)
    xs = np.array(sorted(good)); ok = np.array([not good[x][3] for x in xs])
    if ok.sum() < 6: return None
    # longest run of columns (one brow), allowing small gaps
    # the brow = the longest run of on-skin columns (gaps <= 3 px allowed); hair-covered ends are not brow
    okx = xs[ok]; gaps = np.diff(okx) > 4
    seg_id = np.concatenate([[0], np.cumsum(gaps)]); best = np.bincount(seg_id).argmax()
    okx = okx[seg_id == best]
    X = np.arange(okx.min(), okx.max() + 1)
    xs = np.array([x for x in xs if okx.min() <= x <= okx.max()]); ok = np.array([not good[x][3] for x in xs])
    T = np.interp(X, xs[ok], [good[x][0] for x in xs[ok]]); Bo = np.interp(X, xs[ok], [good[x][1] for x in xs[ok]])
    strandcols = set(xs[~ok]) | (set(X) - set(xs))
    sk = np.median([good[x][2] for x in xs[ok]])
    return X, T, Bo, strandcols, sk

def ribbon(X, T, Bo, mode, inner_left, factor=2.0):
    """Centre-line ribbon: centre c(x) & perpendicular thickness from v3's stroke, smoothed; returns top & bottom
    edge polylines (lists of (x, y)) of the new brow: 2x thickness, grown upward ('up') or both ways ('sym')."""
    k = max(5, (len(X) // 6) | 1)
    c = ndimage.median_filter((T + Bo) / 2, k, mode="nearest")
    deg = 2 if len(X) > 12 else 1
    u = (X - X[0]) / max(X[-1] - X[0], 1)
    c = np.polyval(np.polyfit(u, c, deg), u)
    slope = np.gradient(c, X)
    hv = ndimage.median_filter(Bo - T + 1, k, mode="nearest")
    hp = hv * np.cos(np.arctan(slope))                                  # perpendicular thickness
    hp = ndimage.gaussian_filter1d(hp, max(2, len(X) / 6), mode="nearest")
    hp = np.clip(hp, np.median(hp) * 0.6, np.median(hp) * 1.3)
    uu = u if inner_left else 1 - u                                     # 0 = head, 1 = tail
    Lx = max(X[-1] - X[0], 1); r = min(0.25, hp[np.argmin(uu)] * factor / 2 / Lx)
    cap = np.sqrt(np.clip(1 - ((r - np.minimum(uu, r)) / max(r, 1e-3)) ** 2, 0.05, 1))
    tail = np.where(uu > 0.72, 1 - 0.65 * ((uu - 0.72) / 0.28) ** 1.3, 1.0)
    h_old = hp
    h_new = hp * factor * cap * tail
    nrm = np.stack([-slope, np.ones_like(slope)], 1); nrm /= np.linalg.norm(nrm, axis=1, keepdims=True)   # points down
    P = np.stack([X + 0.5, c], 1)
    if mode == "up":
        bot = P + nrm * (h_old / 2)[:, None]                            # keep v3's bottom edge
        top = bot - nrm * h_new[:, None]
    else:
        top = P - nrm * (h_new / 2)[:, None]; bot = P + nrm * (h_new / 2)[:, None]
    return top, bot, T, Bo

def render(a, X, topl, botl, ot, ob, hair, skin, strandcols, v3):
    allp = np.concatenate([topl, botl])
    x0, x1 = int(np.floor(allp[:, 0].min())) - 3, int(np.ceil(allp[:, 0].max())) + 4
    y0, y1 = int(np.floor(allp[:, 1].min())) - 3, int(np.ceil(allp[:, 1].max())) + 4
    H, W = (y1 - y0) * SS, (x1 - x0) * SS
    big = np.zeros((H, W), np.float32)
    pts = np.concatenate([topl, botl[::-1]]); pts = ((pts - [x0, y0]) * SS).astype(np.int32)
    cv2.fillPoly(big, [pts], 1.0)
    big = cv2.GaussianBlur(big, (0, 0), SS * 0.6); big = (big > 0.5).astype(np.float32)
    cov = cv2.resize(big, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
    reg = a[y0:y1, x0:x1].copy(); src = v3[y0:y1, x0:x1]
    # texture from v3's own brow: its luminance along the centre line (the hair-stroke rhythm), slanted like brow hairs
    lum = src.mean(-1)
    prof = np.array([lum[min(max(int(round((t + bb) / 2)) - y0, 0), y1 - y0 - 1), min(max(x - x0, 0), x1 - x0 - 1)] for x, t, bb in zip(X, ot, ob)])
    prof = (prof - prof.mean()) / (prof.std() + 1e-3)
    tex = np.zeros(cov.shape, np.float32)
    slope = 0.6 if INNER_LEFT[0] else -0.6                      # strokes lean toward the tail
    for yy in range(y1 - y0):
        shift = (yy - (y1 - y0) / 2) * slope
        tex[yy] = np.interp(np.arange(x1 - x0) + x0 + shift, X, prof, left=0, right=0)
    tex = cv2.GaussianBlur(tex, (0, 0), 0.6)
    gx = (np.arange(x1 - x0)[None, :] + x0 - X[0]) / max(X[-1] - X[0], 1); gx = np.clip(gx if INNER_LEFT[0] else 1 - gx, 0, 1)
    mix = (0.04 + 0.16 * gx ** 1.5) + np.clip(tex, -1.5, 2) * 0.035
    col = hair[None, None] * (1 - mix[..., None]) + skin[None, None] * mix[..., None]
    c = cov[..., None]
    out = reg * (1 - c) + col * c
    # hair over the brow: dark hair pixels connected to hair outside the new shape, excluding v3's own brow pixels
    oldb = np.zeros(cov.shape, bool)
    for x, t, bb in zip(X, ot, ob):
        if x0 <= x < x1: oldb[max(int(t) - 1 - y0, 0):max(int(bb) + 2 - y0, 0), x - x0] = True
    dk = (lum < skin.mean() - 80) & ~oldb
    lab, n = ndimage.label(dk)
    outside = dk & ~ndimage.binary_dilation(cov > 0.02, iterations=2)
    ids = np.unique(lab[outside]); ids = ids[ids > 0]
    hairm = np.isin(lab, ids) & (cov > 0.02)
    hairm = ndimage.binary_dilation(hairm, iterations=1) & (lum < skin.mean() - 40) & ~oldb
    out[hairm] = src[hairm]
    a[y0:y1, x0:x1] = out
    return a

SHEETS = [("turn", "paper/old_v3/paper_jade_turnaround.png", [(250, 140, 520, 420), (880, 140, 1160, 420)]),
          ("expr", "paper/old_v3/paper_expr_jade.png", [(c * 917, r * 768, c * 917 + 917, r * 768 + 768) for r in range(2) for c in range(3)]),
          ("lineup", "paper/old_v3/paper_lineup.png", [(450, 150, 700, 400)])]

if __name__ == "__main__":
    for nm, src, faces in SHEETS:
        v3 = np.array(Image.open(V + src).convert("RGB")).astype(np.float32)
        outs = {"v8": v3.copy(), "v8b": v3.copy()}
        for box in faces:
            Lm = B5.landmarks(v3, box)
            if Lm is None: print("noface", nm, box); continue
            hair = S6.hair_tone(v3, box, Lm)
            for s in ("R", "L"):
                P = Lm[S6.SIDE[s]["brow"]]
                ew = np.linalg.norm(Lm[S6.SIDE[s]["inner"]] - Lm[S6.SIDE[s]["outer"]])
                prof = brow_profile(v3, P, ew, lid_y=Lm[S6.SIDE[s]["lid"]][1])
                if prof is None: print("  no brow", nm, box[:2], s); continue
                X, T, Bo, strandcols, sk = prof
                ring = v3[int(Bo.max()) + 3:int(Bo.max()) + 7, X[0]:X[-1]].reshape(-1, 3)
                skin = np.median(ring[ring.mean(-1) > sk - 30], 0) if (ring.mean(-1) > sk - 30).sum() > 5 else np.array([sk] * 3, float)
                inner_left = Lm[S6.SIDE[s]["inner"]][0] < (X[0] + X[-1]) / 2; INNER_LEFT[0] = inner_left
                for key, mode in (("v8", "up"), ("v8b", "sym")):
                    tl, bl, ot, ob = ribbon(X, T, Bo, mode, inner_left)
                    outs[key] = render(outs[key], X, tl, bl, ot, ob, hair, skin, strandcols, v3)
                print(" ", nm, box[:2], s, "cols", len(X), "v3 thick", round(float(np.median(Bo - T + 1)), 1))
        for k, im in outs.items():
            Image.fromarray(np.clip(im, 0, 255).astype(np.uint8)).save(V + f"v6/{nm}_{k}.png")
