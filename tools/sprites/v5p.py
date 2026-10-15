"""v5 brows, procedural on v4 pixels (the model edits thinned 30-70% and moved the top edge, so they were rejected):
per brow column: trim ~10% from the BOTTOM edge (top stays), image-left brow -> straight (small column shifts of the brow
run toward a straight top line), image-right brow -> slight arch, then feathery hair-strokes inside the brow mask only."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/sprites")
import v5_brows as B5

def brow(a, P, straight, rng, trim=0.10, arch=0.05, maxshift_frac=0.35, feather_strength=0.33, log=None):
    cols = B5.brow_columns(a, P)
    if len(cols) < 8: log.append("few cols"); return a
    lum = a.mean(-1)
    def clean(x):
        t, b, sk = cols[x]
        up = lum[max(t - 5, 0):t - 2, x]; dn = lum[b + 2:b + 5, x]
        return up.size and dn.size and up.mean() > sk - 25 and dn.mean() > sk - 25
    cols = {x: v for x, v in cols.items() if clean(x)}
    if len(cols) < 8: log.append("few clean cols"); return a
    xs = np.array(sorted(cols)); T = np.array([cols[x][0] for x in xs], float); Bo = np.array([cols[x][1] for x in xs], float)
    th = np.median(Bo - T + 1); lim = max(1.5, th * maxshift_frac)
    Ts = ndimage.median_filter(T, 5); lin = np.polyval(np.polyfit(xs, Ts, 1), xs)
    u = (xs - xs.min()) / max(np.ptp(xs), 1)
    inner_left = abs(P[:, 0].min() - xs.min()) < 1 and np.mean(P[:, 0]) > 0
    if straight:
        tgt = lin
    else:
        # tail is the end farther from the face centre; peak at ~2/3 toward the tail
        face_mid = P.attrs_mid if hasattr(P, "attrs_mid") else None
        tail_right = True if log is None else log_tail_right
        uu = u if tail_right else 1 - u
        bump = -arch * np.ptp(xs) * np.clip(np.where(uu < 0.66, uu / 0.66, (1 - uu) / 0.34), 0, 1)
        cur = Ts - lin
        tgt = lin + np.minimum(cur, bump)          # only adds arch where the brow is flatter than the target
    shift = np.clip(np.round(tgt - Ts), -lim, lim).astype(int)
    out = a.copy(); M = np.zeros(a.shape[:2], bool)
    for x, s, t, b in zip(xs, shift, T.astype(int), Bo.astype(int)):
        k = int(round(trim * (b - t + 1)))
        nb = b - k
        below = a[b + 2:b + 6, x].mean(0); above = a[max(t - 6, 0):t - 2, x].mean(0)
        y0, y1 = t - 3, b + 4
        col = a[y0:y1, x].copy()
        # trim bottom rows
        for y in range(nb + 1, b + 1): col[y - y0] = below
        if k > 0: col[nb - y0] = col[nb - y0] * 0.75 + below * 0.25      # soften the new bottom edge
        # shift brow run (rows t..nb) by s
        new = col.copy()
        run = col[t - y0:nb - y0 + 1].copy()
        for y in range(y0, y1): new[y - y0] = above if y < t + s else (below if y > nb + s else new[y - y0])
        for i, v in enumerate(run):
            yy = t + s + i
            if y0 <= yy < y1: new[yy - y0] = v
        out[y0:y1, x] = new
        M[t + s:nb + s + 1, x] = True
    if feather_strength > 0:
        bot = M & ~np.roll(M, -1, axis=0)                     # bottom edge pixels
        ys, xs2 = np.nonzero(bot); pick = rng.random(len(ys)) < 0.4
        for y, x in zip(ys[pick], xs2[pick]):
            out[y, x] = out[y, x] * 0.55 + out[min(y + 3, out.shape[0] - 1), x] * 0.45
    log.append(dict(cols=len(xs), thick=float(th), trim=int(round(trim * th)), maxshift=int(np.abs(shift).max())))
    return out

log_tail_right = True
def run(src, dst, faces, side=None):
    global log_tail_right
    a = np.array(Image.open(src).convert("RGB")).astype(np.float32); rng = np.random.default_rng(3); log = []
    for box in faces:
        L = B5.landmarks(a, box)
        if L is None: print("  noface", box); continue
        PA, PB = L[B5.BROWS["A"]], L[B5.BROWS["B"]]
        left, right = (PA, PB) if PA[:, 0].mean() < PB[:, 0].mean() else (PB, PA)
        log_tail_right = False; a = brow(a, left, True, rng, log=log)       # image-left: tail on the left
        log_tail_right = True; a = brow(a, right, False, rng, log=log)      # image-right: tail on the right
    if side is not None:
        log_tail_right = False; a = brow(a, np.array(side, float), False, rng, log=log)   # profile faces image-left: tail on the right? (see notes)
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(dst)
    for l in log: print("  ", l)

if __name__ == "__main__":
    V = "/home/jade/Documents/vibesong/assets/sheets/"
    run(V + "paper/old_v4/paper_jade_turnaround.png", V + "raw/v5_turn.png", [(250, 140, 520, 420), (880, 140, 1160, 420)],
        side=[(1591, 222), (1597, 220), (1603, 219), (1609, 220), (1614, 222), (1597, 224), (1606, 223)])
    run(V + "paper/old_v4/paper_expr_jade.png", V + "raw/v5_expr.png", [(c * 917, r * 768, c * 917 + 917, r * 768 + 768) for r in range(2) for c in range(3)])
    run(V + "paper/old_v4/paper_lineup.png", V + "raw/v5_lineup.png", [(450, 150, 700, 400)])
