"""Clean colored-pencil brow redraw: smooth filled outline (from the warped trace alpha), hair-mid-tone fill with a
gradient (inner head darker -> tail lighter), fine directional strokes inside, 1-px anti-aliased edge (no halo),
then hair strands re-composited on top."""
import numpy as np, cv2
from PIL import Image, ImageDraw
from scipy import ndimage
LAST_MASK = None
SS = 4

def outline(al, straight=False, inner_x=None):
    """Clean brow shape: per-column top/bottom of the trace mask, smoothed with low-order fits, filled at SS x."""
    env = cv2.GaussianBlur(al.astype(np.float32), (0, 0), 1.0)
    m = env > 0.22                                           # envelope of the stroke cloud = v6B's visual thickness
    lab, n = ndimage.label(m)
    if n == 0: return None, None
    m = lab == (np.argmax(ndimage.sum(m, lab, range(1, n + 1))) + 1)
    if m.sum() < 5: return None, None
    ys, xs = np.nonzero(m); y0, y1, x0, x1 = ys.min() - 6, ys.max() + 7, xs.min() - 6, xs.max() + 7
    sub = cv2.resize(m[y0:y1, x0:x1].astype(np.float32), None, fx=SS, fy=SS, interpolation=cv2.INTER_LINEAR) > 0.5
    sub = ndimage.binary_closing(sub, iterations=SS * 2)
    yy, xx = np.nonzero(sub); X = np.arange(xx.min(), xx.max() + 1)
    top = np.array([np.percentile(yy[xx == x], 3) if (xx == x).sum() > 1 else np.nan for x in X])
    bot = np.array([np.percentile(yy[xx == x], 97) if (xx == x).sum() > 1 else np.nan for x in X])
    ok = ~np.isnan(top); top = np.interp(X, X[ok], top[ok]); bot = np.interp(X, X[ok], bot[ok])
    u = (X - X[0]) / max(X[-1] - X[0], 1)
    deg = 1 if straight else 2                               # her right brow straight, her left a soft arch
    tf = np.polyval(np.polyfit(u, top, deg), u); bf = np.polyval(np.polyfit(u, bot, 3), u)
    bf = np.maximum(bf, tf + SS * 1.2)
    inner_left = True if inner_x is None else (inner_x < x0 + (X[0] + X[-1]) / 2 / SS)
    uu = u if inner_left else 1 - u                          # 0 = inner head, 1 = tail
    h0 = np.median((bf - tf) / 2)
    half = h0 * (1.0 - 0.6 * uu ** 1.6)                      # full at the head, tapering to a point-ish tail
    body = half.copy()
    Lpx = max(X[-1] - X[0], 1); cf = min(0.3, h0 * 1.1 / Lpx)       # semicircular head, radius ~ head half-height
    cap = np.sqrt(np.clip(1 - ((cf - np.minimum(uu, cf)) / cf) ** 2, 0.0, 1))
    half = half * np.maximum(cap, 0.0)
    tailcap = np.sqrt(np.clip(1 - ((np.maximum(uu, 0.93) - 0.93) / 0.07) ** 2, 0.0, 1))
    half = half * np.maximum(tailcap, 0.15)
    mid = tf + body if straight else (tf + bf) / 2           # straight brow: straight top line along the body
    big = np.zeros(sub.shape, np.float32)
    pts = np.concatenate([np.c_[X, mid - half], np.c_[X[::-1], (mid + half)[::-1]]]).astype(np.int32)
    cv2.fillPoly(big, [pts], 1.0)
    cov = cv2.resize(big, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
    return (y0, y1, x0, x1), (big, cov)

def draw(a, al, hair, skin, inner_x, seed=0, straight=False):
    global LAST_MASK
    box, res = outline(al, straight, inner_x)
    if box is None: LAST_MASK = al > 0.45; return a
    y0, y1, x0, x1 = box; big, cov = res
    H, W = big.shape
    rng = np.random.default_rng(seed)
    ys, xs = np.nonzero(big > 0.5)
    bx0, bx1 = xs.min(), xs.max(); L = max(bx1 - bx0, 1)
    inner_left = inner_x < (x0 + (bx0 + bx1) / 2 / SS)
    # centre line & thickness per column (for stroke placement)
    colx = np.arange(bx0, bx1 + 1)
    top = np.array([ys[xs == x].min() if (xs == x).any() else np.nan for x in colx]); bot = np.array([ys[xs == x].max() if (xs == x).any() else np.nan for x in colx])
    ok = ~np.isnan(top); top = np.interp(colx, colx[ok], top[ok]); bot = np.interp(colx, colx[ok], bot[ok])
    # base fill: gradient along the brow (u = 0 inner head .. 1 tail)
    gx = np.arange(W)[None, :].repeat(H, 0)
    u = np.clip((gx - bx0) / L, 0, 1); u = u if inner_left else 1 - u
    tail_mix = 0.0 + 0.22 * u ** 1.3                       # how much skin is mixed into the hair tone
    fill = hair[None, None] * (1 - tail_mix[..., None]) + skin[None, None] * tail_mix[..., None]
    # strokes layer (lighter / darker hairs), drawn at SS x
    strokes = Image.new("L", (W, H), 128); d = ImageDraw.Draw(strokes)
    n = int(L * (bot - top).mean() / (SS * SS) * 3.0)
    for _ in range(n):
        x = rng.uniform(bx0, bx1); i = int(x - bx0); t, b = top[i], bot[i]
        uu = (x - bx0) / L; uu = uu if inner_left else 1 - uu
        y = rng.uniform(t + 0.15 * (b - t), b - 0.05 * (b - t))
        ang = np.deg2rad(np.interp(uu, [0, 0.2, 1], [70, 35, 12]) + rng.normal(0, 5))
        dirx = 1 if inner_left else -1                       # hairs grow toward the tail and upward
        ln = SS * rng.uniform(1.6, 3.0) * max(1, (b - t) / SS / 3)
        xb, yb = x + dirx * np.cos(ang) * ln, y - np.sin(ang) * ln
        val = int(rng.choice([60, 90, 200, 230, 240]))           # <128 darker hair, >128 lighter gap
        d.line((x, y, xb, yb), fill=val, width=max(1, int(SS * 0.6)))
    st = (np.array(strokes).astype(np.float32) - 128) / 128  # -1..1
    st = cv2.resize(cv2.GaussianBlur(st, (0, 0), SS * 0.15), (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
    fill = cv2.resize(fill.astype(np.float32), (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
    light = np.clip(st, 0, 1)[..., None] * 0.55; dark = np.clip(-st, 0, 1)[..., None] * 0.35
    col = fill * (1 - light) + skin * light
    col = col * (1 - dark) + hair * 0.82 * dark               # dark hairs: a little below the mid-tone, still within the hair's range
    reg = a[y0:y1, x0:x1].copy()
    # hair strands crossing the brow: dark pixels connected to dark pixels outside the brow outline
    lum = reg.mean(-1); dk = lum < skin.mean() - 60
    inside = cov > 0.02
    lab, n = ndimage.label(dk)
    outside_dark = dk & ~ndimage.binary_dilation(inside, iterations=2)
    ids = np.unique(lab[outside_dark]); ids = ids[ids > 0]
    keep = np.isin(lab, ids) if n else np.zeros_like(dk)
    strands = keep & inside
    c = cov[..., None]
    out = reg * (1 - c) + col * c
    out[strands] = reg[strands]                                # brow goes UNDER the hair
    a[y0:y1, x0:x1] = out
    M = np.zeros(a.shape[:2], bool); M[y0:y1, x0:x1] = cov > 0.5; LAST_MASK = M
    return a
