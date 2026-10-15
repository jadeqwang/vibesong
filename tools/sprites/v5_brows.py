"""v5 brows, procedural (no model): on the v4 sheets, per brow
  - trim ~10% of the thickness from the BOTTOM edge only (top edge stays where it is),
  - image-left brow (her right) -> straight: column shifts so its top edge follows a straight line,
    image-right brow (her left) -> keeps / gets a slight arch,
  - feathery pencil texture: break the fill into fine hair strokes rising toward the tail.
Everything outside the brow band stays v4."""
import sys, numpy as np, cv2
from PIL import Image
from scipy import ndimage
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=mpt.BaseOptions(
    model_asset_path="/home/jade/Documents/1-music-shipped/moongazing/tools/sync/models/face_landmarker.task")))
BROWS = {"A": [70, 63, 105, 66, 107, 46, 53, 52, 65, 55], "B": [300, 293, 334, 296, 336, 276, 283, 282, 295, 285]}

def landmarks(a, box, up=3):
    x0, y0, x1, y1 = box; c = np.ascontiguousarray(a[y0:y1, x0:x1].astype(np.uint8))
    big = cv2.resize(c, None, fx=up, fy=up, interpolation=cv2.INTER_CUBIC)
    r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=big))
    if not r.face_landmarks: return None
    return np.array([[p.x * big.shape[1] / up + x0, p.y * big.shape[0] / up + y0] for p in r.face_landmarks[0]])

def brow_columns(a, P, pad=6):
    """Per column inside the brow span: top/bottom of the dark brow run nearest the landmark centreline."""
    x0, x1 = int(P[:, 0].min()), int(P[:, 0].max())
    ctr = np.polyfit(P[:, 0], P[:, 1], 2)
    lum = a.mean(-1)
    out = {}
    hgt = np.ptp(P[:, 1]) + 2
    for x in range(x0, x1 + 1):
        cy = int(round(np.polyval(ctr, x)))
        col = lum[cy - int(hgt) - pad: cy + int(hgt) + pad, x]
        if col.size < 5: continue
        skin = np.percentile(col, 90); dark = np.percentile(col, 5)
        if skin - dark < 40: continue
        thr = (skin + dark) / 2
        m = col < thr; c0 = cy - int(hgt) - pad
        k = cy - c0
        if not m[min(max(k, 0), len(m) - 1)]:
            idx = np.nonzero(m)[0]
            if not len(idx): continue
            k = idx[np.argmin(np.abs(idx - k))]
        t = k
        while t > 0 and m[t - 1]: t -= 1
        b = k
        while b < len(m) - 1 and m[b + 1]: b += 1
        if b - t > hgt * 1.8: continue          # a hair strand crossing the brow: skip column
        out[x] = (c0 + t, c0 + b, skin)
    return out

def process_brow(a, P, straight, trim=0.10, arch=0.06, rng=None):
    cols = brow_columns(a, P)
    if len(cols) < 8: return "few cols"
    xs = np.array(sorted(cols)); T = np.array([cols[x][0] for x in xs], float); Bt = np.array([cols[x][1] for x in xs], float)
    thick = np.median(Bt - T + 1)
    # target top edge
    Ts = ndimage.gaussian_filter1d(T, 2)
    if straight:
        tgt = np.polyval(np.polyfit(xs, Ts, 1), xs)
    else:
        lin = np.polyval(np.polyfit(xs, Ts, 1), xs)
        u = (xs - xs.min()) / max(np.ptp(xs), 1)
        # slight arch: peak ~65% toward the tail, height = arch * length (only if the brow is flatter than that)
        bump = -arch * np.ptp(xs) * np.clip(np.where(u < 0.65, u / 0.65, (1 - u) / 0.35), 0, 1) ** 1.2
        cur = Ts - lin
        tgt = lin + np.minimum(cur, bump) if (cur.min() > bump.min() * 0.8) else Ts
    shift = np.round(tgt - Ts).astype(int)
    out = a.copy(); H = a.shape[0]
    for x, s, t, b in zip(xs, shift, T, Bt):
        t, b = int(t), int(b); skin = cols[x][2]
        newb = b - int(round(trim * (b - t + 1)))
        y0, y1 = t - 4, b + 5
        band = a[y0:y1, x].copy()
        # 1) remove the trimmed bottom rows: blend them toward the skin seen just below the brow
        below = a[b + 3:b + 7, x].mean(0)
        for y in range(newb + 1, b + 1):
            band[y - y0] = below * 0.85 + band[y - y0] * 0.15
        # 2) shift the brow run vertically by s, filling vacated rows with skin
        newband = np.repeat(below[None], len(band), 0) * 1.0
        above = a[t - 6:t - 3, x].mean(0)
        for i in range(len(band)):
            j = i - s
            if 0 <= j < len(band): newband[i] = band[j]
            else: newband[i] = above if i < len(band) / 2 else below
        out[y0:y1, x] = newband
    return out, dict(cols=len(xs), thick=round(float(thick), 1), max_shift=int(np.abs(shift).max()))

def feather(a, before, P, rng, strength=0.45):
    """Break solid brow fill into hair strokes: lighten thin gaps between strokes slanting up toward the tail."""
    x0, x1 = int(P[:, 0].min()) - 3, int(P[:, 0].max()) + 3; y0, y1 = int(P[:, 1].min()) - 10, int(P[:, 1].max()) + 10
    reg = a[y0:y1, x0:x1].astype(float); lum = reg.mean(-1)
    skin = np.percentile(lum, 92); dark = np.percentile(lum, 5)
    m = lum < (skin + dark) / 2
    if m.sum() < 20: return a
    yy, xx = np.mgrid[0:reg.shape[0], 0:reg.shape[1]]
    inner_left = P[:, 0].mean() < 0   # unused
    u = (xx - xx.min()) / max(xx.max(), 1)
    ang = 0.55                                   # strokes rise toward the tail
    phase = xx * np.cos(ang) - yy * np.sin(ang) * 2.2 + rng.normal(0, 0.6, xx.shape)
    period = max(2.6, (y1 - y0) / 9)
    gap = (np.sin(phase / period * 2 * np.pi) > 0.55)
    # edges: ragged top/bottom (single hairs)
    edge = m & ~ndimage.binary_erosion(m, iterations=1)
    lighten = (gap & m) | (edge & (rng.random(m.shape) < 0.35))
    skin_col = reg[lum > np.percentile(lum, 85)].mean(0)
    al = (lighten * strength)[..., None]
    reg = reg * (1 - al) + skin_col * al
    a[y0:y1, x0:x1] = reg
    return a

def run(src, dst, faces, side_boxes=()):
    a = np.array(Image.open(src).convert("RGB")).astype(np.float32); rng = np.random.default_rng(7)
    log = []
    for box in faces:
        L = landmarks(a, box)
        if L is None: log.append(("noface", box)); continue
        PA, PB = L[BROWS["A"]], L[BROWS["B"]]
        left, right = (PA, PB) if PA[:, 0].mean() < PB[:, 0].mean() else (PB, PA)
        for P, straight in ((left, True), (right, False)):
            res = process_brow(a, P, straight)
            if isinstance(res, str): log.append((box, res)); continue
            a, info = res
            a = feather(a, None, P, rng)
            log.append((box, "straight" if straight else "arch", info))
    for P in side_boxes:   # profile view: one brow (her left -> arched), landmarks given as a polyline
        P = np.array(P, float)
        res = process_brow(a, P, False)
        if not isinstance(res, str): a, info = res; a = feather(a, None, P, rng); log.append(("side", info))
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(dst)
    for l in log: print("  ", l)

if __name__ == "__main__":
    V = "/home/jade/Documents/vibesong/assets/sheets/"
    run(V + "paper/old_v4/paper_jade_turnaround.png", V + "raw/v5_turn.png", [(250, 140, 520, 420), (880, 140, 1160, 420)],
        side_boxes=[[(1588, 216), (1596, 213), (1604, 212), (1612, 214), (1616, 217), (1592, 221), (1604, 219)]])
    run(V + "paper/old_v4/paper_expr_jade.png", V + "raw/v5_expr.png", [(c * 917, r * 768, c * 917 + 917, r * 768 + 768) for r in range(2) for c in range(3)])
    run(V + "paper/old_v4/paper_lineup.png", V + "raw/v5_lineup.png", [(450, 150, 700, 400)])
