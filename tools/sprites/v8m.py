"""v8 brows from hand-annotated v3 brow centre-lines (head -> tail, sheet pixel coords).
Each brow = ONE smooth ribbon: v3's own thickness (measured perpendicular to the centre-line) x2, grown upward (v8,
bottom edge and brow-to-eye gap kept) or symmetrically (v8b). Rounded head, tapered tail, hair mid-tone fill with v3's
own stroke texture, 1-px anti-aliased edge, hair strands re-layered on top."""
import sys, numpy as np, cv2
from PIL import Image
from scipy import ndimage
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/sprites")
import v5_brows as B5, v6_brows as S6
V = "/home/jade/Documents/vibesong/assets/sheets/"
SS = 4
BROWS = {   # sheet: [(face box for landmarks/hair tone, [brow polylines head->tail])]
 "turn": ("paper/old_v3/paper_jade_turnaround.png", [
   ((250, 140, 520, 420), [[(374, 207), (368, 203), (360, 202), (352, 202.5)], [(402, 207), (410, 203), (420, 202), (428, 202.5)]]),
   ((880, 140, 1160, 420), [[(972, 210), (966, 206), (958, 205), (951, 206)], [(999, 206), (1005, 202), (1015, 200), (1025, 200), (1032, 201)]])]),
 "expr": ("paper/old_v3/paper_expr_jade.png", [
   ((0, 0, 917, 768), [[(461, 322), (445, 314), (425, 313), (410, 315)], [(527, 328), (540, 318), (560, 314), (580, 313)]]),
   ((917, 0, 1834, 768), [[(1263, 330), (1250, 322), (1235, 320), (1222, 322)], [(1325, 318), (1340, 310), (1360, 306), (1380, 305)]]),
   ((1834, 0, 2751, 768), [[(2148, 288), (2135, 291), (2120, 295), (2110, 299)], [(2201, 279), (2215, 282), (2235, 285), (2255, 288), (2268, 290)]]),
   ((0, 768, 917, 1536), [[(362, 1095), (350, 1088), (335, 1084), (318, 1083)], [(402, 1087), (430, 1080), (450, 1072), (470, 1068), (488, 1069)]]),
   ((917, 768, 1834, 1536), [[(1242, 1071), (1225, 1076), (1210, 1082)], [(1292, 1061), (1310, 1063), (1330, 1065), (1350, 1067), (1365, 1069)]]),
   ((1834, 768, 2751, 1536), [[(2130, 1116), (2115, 1108), (2095, 1102), (2078, 1099)], [(2172, 1116), (2190, 1108), (2210, 1103), (2230, 1100), (2245, 1099)]])]),
 "lineup": ("paper/old_v3/paper_lineup.png", [
   ((450, 150, 700, 400), [[(535, 244), (530, 240), (520, 238), (512, 238.5)], [(566, 244), (572, 240), (582, 238), (592, 238.5)]])]),
}

def centerline(pts, n=80, extend=0.12):
    P = np.array(pts, float); d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]; t = d / d[-1]
    deg = min(2, len(P) - 1)
    fx, fy = np.polyfit(t, P[:, 0], deg), np.polyfit(t, P[:, 1], deg)
    T = np.linspace(0, 1 + extend, n)                       # extend the tail a little (it runs under the hair)
    C = np.c_[np.polyval(fx, T), np.polyval(fy, T)]
    tan = np.gradient(C, axis=0); tan /= np.linalg.norm(tan, axis=1, keepdims=True)
    nrm = np.c_[-tan[:, 1], tan[:, 0]]; nrm[nrm[:, 1] < 0] *= -1   # normal pointing DOWN (towards the eye)
    return C, nrm, T

def measure(a, C, nrm, T, skin_l):
    """v3 stroke thickness perpendicular to the centre-line (visible part, T<=1), and its centre offset."""
    lum = a.mean(-1); th, off = [], []
    for c, n_, t in zip(C, nrm, T):
        if t > 1 or t < 0.08: continue
        s = np.arange(-8, 8.01, 0.25); pts = c + s[:, None] * n_
        v = ndimage.map_coordinates(lum, [pts[:, 1], pts[:, 0]], order=1)
        dk = v < skin_l - 0.5 * (skin_l - v.min())
        if dk.sum() < 2: continue
        idx = np.nonzero(dk)[0]; k = idx[np.argmin(np.abs(s[idx]))]
        lo = k; hi = k
        while lo > 0 and dk[lo - 1]: lo -= 1
        while hi < len(s) - 1 and dk[hi + 1]: hi += 1
        th.append((hi - lo + 1) * 0.25); off.append((s[lo] + s[hi]) / 2)
    return float(np.median(th)), float(np.median(off))

def track(a, C, nrm, T, skin_l, S):
    """Per-sample v3 stroke edges (lo, hi offsets along the normal), smoothed; extension samples extrapolated."""
    lum = a.mean(-1); lo_l, hi_l = np.full(len(C), np.nan), np.full(len(C), np.nan)
    for i, (c, n_, t) in enumerate(zip(C, nrm, T)):
        if t > 1: continue
        s_ = np.arange(-9, 9.01, 0.25); pts = c + s_[:, None] * n_
        v = ndimage.map_coordinates(lum, [pts[:, 1], pts[:, 0]], order=1)
        dk = v < skin_l - 0.45 * (skin_l - min(v.min(), skin_l - 60))
        idx = np.nonzero(dk)[0]
        if not len(idx): continue
        k = idx[np.argmin(np.abs(s_[idx]))]; lo = hi = k
        while lo > 0 and dk[lo - 1]: lo -= 1
        while hi < len(s_) - 1 and dk[hi + 1]: hi += 1
        if (hi - lo) * 0.25 > 2.2 * S: continue                         # merged with hair: ignore
        lo_l[i], hi_l[i] = s_[lo], s_[hi]
    ok = ~np.isnan(lo_l)
    if ok.sum() < 3: return np.full(len(C), -S / 2), np.full(len(C), S / 2)
    x = np.arange(len(C))
    lo_l = np.interp(x, x[ok], lo_l[ok]); hi_l = np.interp(x, x[ok], hi_l[ok])
    lo_l = ndimage.gaussian_filter1d(ndimage.median_filter(lo_l, 7, mode="nearest"), 3, mode="nearest")
    hi_l = ndimage.gaussian_filter1d(ndimage.median_filter(hi_l, 7, mode="nearest"), 3, mode="nearest")
    return lo_l, hi_l

def ribbon_poly2(C, nrm, T, lo, hi, S, mode, factor=2.0):
    u = np.clip(T / T.max(), 0, 1)
    L = np.linalg.norm(np.diff(C, axis=0), axis=1).sum()
    h = np.clip(hi - lo, 0.85 * S, 1.25 * S)
    hN = h * factor
    r = min(0.25, np.median(hN) / 2 / L)
    cap = np.sqrt(np.clip(1 - ((r - np.minimum(u, r)) / r) ** 2, 0.04, 1))
    tail = np.where(u > 0.6, 1 - 0.75 * ((u - 0.6) / 0.4) ** 1.4, 1.0)
    w = hN * cap * tail
    if mode == "up":
        bot = C + nrm * hi[:, None]; top = bot - nrm * w[:, None]
    else:
        mid = C + nrm * ((lo + hi) / 2)[:, None]; top = mid - nrm * (w / 2)[:, None]; bot = mid + nrm * (w / 2)[:, None]
    return top, bot

def ribbon_poly(C, nrm, T, h0, off, mode, factor=2.0):
    u = np.clip(T / T.max(), 0, 1)                         # 0 head .. 1 tail (incl. extension)
    L = np.linalg.norm(np.diff(C, axis=0), axis=1).sum()
    hN = h0 * factor
    r = min(0.25, hN / 2 / L)
    cap = np.sqrt(np.clip(1 - ((r - np.minimum(u, r)) / r) ** 2, 0.04, 1))
    tail = np.where(u > 0.6, 1 - 0.75 * ((u - 0.6) / 0.4) ** 1.4, 1.0)
    w = hN * cap * tail
    Cc = C + nrm * off
    if mode == "up":
        bot = Cc + nrm * (h0 / 2) * np.maximum(cap * tail, 0.5)[:, None] * 1.0
        top = bot - nrm * w[:, None]
    else:
        top = Cc - nrm * (w / 2)[:, None]; bot = Cc + nrm * (w / 2)[:, None]
    return top, bot

def render(a, v3, top, bot, C, nrm, T, h0, off, hair, skin, lo=None, hi=None):
    allp = np.concatenate([top, bot]); x0, y0 = np.floor(allp.min(0)).astype(int) - 4; x1, y1 = np.ceil(allp.max(0)).astype(int) + 5
    big = np.zeros(((y1 - y0) * SS, (x1 - x0) * SS), np.float32)
    pts = ((np.concatenate([top, bot[::-1]]) - [x0, y0]) * SS).astype(np.int32); cv2.fillPoly(big, [pts], 1.0)
    big = (cv2.GaussianBlur(big, (0, 0), SS * 0.5) > 0.5).astype(np.float32)
    cov = cv2.resize(big, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
    reg = a[y0:y1, x0:x1].copy(); src = v3[y0:y1, x0:x1]; lum = src.mean(-1)
    if lo is not None:   # erase any part of v3's stroke that the new shape doesn't cover (no double stroke)
        old = np.zeros(cov.shape, bool)
        for cc, n_, l_, h_, t in zip(C, nrm, lo, hi, T):
            if t > 1: continue
            for s_ in np.arange(l_ - 1.5, h_ + 1.6, 0.4):
                p = cc + n_ * s_; xi, yi = int(round(p[0])) - x0, int(round(p[1])) - y0
                if 0 <= yi < old.shape[0] and 0 <= xi < old.shape[1]: old[yi, xi] = True
        dens = cv2.blur((lum < skin.mean() - 80).astype(np.float32), (9, 9))
        old = ndimage.binary_dilation(old, iterations=1) & (cov < 0.98) & (lum < skin.mean() - 20) & (dens < 0.45)
        rng = np.random.default_rng(0)
        fillc = skin[None, None] + rng.normal(0, 1.5, reg.shape)
        al = cv2.GaussianBlur(old.astype(np.float32), (0, 0), 0.7)[..., None]
        reg = reg * (1 - al) + fillc * al
    # parameter along the brow for every pixel (nearest centre-line sample) -> gradient + v3 texture
    yy, xx = np.mgrid[y0:y1, x0:x1]
    d2 = (xx[..., None] - C[None, None, :, 0]) ** 2 + (yy[..., None] - C[None, None, :, 1]) ** 2
    k = d2.argmin(-1); u = (T / T.max())[k]
    cl = v3.mean(-1); texline = ndimage.map_coordinates(cl, [C[:, 1] + nrm[:, 1] * off, C[:, 0] + nrm[:, 0] * off], order=1)
    texline = (texline - np.median(texline)) / (texline.std() + 1e-3)
    tex = np.clip(texline[k], -1.5, 2)
    # slanted hair-stroke rhythm along the brow (subtle), lighter toward the tail
    along = np.cumsum(np.r_[0, np.linalg.norm(np.diff(C, axis=0), axis=1)])[k]
    perp = ((xx - C[k, 0]) * nrm[k, 0] + (yy - C[k, 1]) * nrm[k, 1])
    stroke = np.sin((along + perp * 0.9) / max(1.6, h0 * 0.55) * np.pi) * 0.5 + 0.5
    mix = 0.03 + 0.17 * u ** 1.6 + 0.05 * stroke + 0.02 * np.clip(tex, 0, 2)
    col = hair[None, None] * (1 - mix[..., None]) + skin[None, None] * mix[..., None]
    c = cov[..., None]
    out = reg * (1 - c) + col * c
    # hair over the brow: dark v3 pixels connected to hair outside the new shape and outside v3's own brow stroke
    oldb = np.zeros(cov.shape, bool)
    for cc, n_ in zip(C, nrm):
        for s in np.arange(-h0 / 2 - 3, h0 / 2 + 3, 0.5):
            p = cc + n_ * (off + s); xi, yi = int(round(p[0])) - x0, int(round(p[1])) - y0
            if 0 <= yi < oldb.shape[0] and 0 <= xi < oldb.shape[1]: oldb[yi, xi] = True
    oldb &= u <= 1.0 / (T.max())                         # only the visible (annotated) part is "brow"
    dk = (lum < skin.mean() - 80)
    lab, n = ndimage.label(dk & ~oldb)
    outside = dk & ~ndimage.binary_dilation(cov > 0.02, iterations=2)
    cnt = np.bincount(lab[outside].ravel(), minlength=n + 1); cnt[0] = 0
    ids = np.nonzero(cnt >= 15)[0]                                  # real strands reach well outside the brow
    hairm = np.isin(lab, ids) & (cov > 0.01) & ~oldb
    out[hairm] = src[hairm]
    a[y0:y1, x0:x1] = out
    return a

if __name__ == "__main__":
    for nm, (src, faces) in BROWS.items():
        v3 = np.array(Image.open(V + src).convert("RGB")).astype(np.float32)
        outs = {"v8": v3.copy(), "v8b": v3.copy()}
        for box, brows in faces:
            Lm = B5.landmarks(v3, box); hair = S6.hair_tone(v3, box, Lm)
            for pl in brows:
                C, nrm, T = centerline(pl)
                ring = []
                for cc, n_ in zip(C[T <= 1], nrm[T <= 1]):
                    p = cc + n_ * 9; ring.append(v3[int(p[1]), int(p[0])])
                ring = np.array(ring); skin = np.median(ring[ring.mean(-1) > np.percentile(ring.mean(-1), 40)], 0)
                h0m, offm = measure(v3, C, nrm, T, skin.mean())
                S = {"turn": 3.6, "expr": 5.0, "lineup": 4.0}[nm]          # v3's typical stroke width on this sheet
                h0 = float(np.clip(h0m, 0.85 * S, 1.2 * S)); off = float(np.clip(offm, -2.5, 3.5)) if abs(h0m - h0) < 0.5 else 0.0
                print(nm, box[:2], pl[0], "v3 thickness", round(h0, 2), "offset", round(off, 2))
                off = {"turn": 0.5, "expr": 3.0, "lineup": 0.5}[nm]       # my annotations sit ~3 px above the stroke centre on the expr sheet
                lo = np.full(len(C), off - S / 2); hi = np.full(len(C), off + S / 2)
                for key, mode in (("v8", "up"), ("v8b", "sym")):
                    top, bot = ribbon_poly(C + nrm * off, nrm, T, S, 0.0, mode)
                    outs[key] = render(outs[key], v3, top, bot, C, nrm, T, S, off, hair, skin, lo, hi)
        for k, im in outs.items():
            Image.fromarray(np.clip(im, 0, 255).astype(np.uint8)).save(V + f"v6/{nm}_{k}.png")
