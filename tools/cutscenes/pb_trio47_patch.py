"""v4.7 (unit v47_trio): replace the gibberish sleeve label ("TAD MHC") on card 05 take b2 with the clean round b/w 1420 MHz patch.
Asset + shading recipe shared with v47_outro (tools/cutscenes/pb_spread47_jacket.py patch_layer): inputs/sleeve_patch_1420MHz.png, light = the
local jacket white, dark = the drawing's near-black pencil, grain/shading taken from the frame, 0.45 px soften -> it stays a pencil drawing.
Tracking: per frame the drawn label's ring is found (holes of the dark mask = the bright inside of the ring, split by the text; their union's
convex hull -> fitEllipse = the ring's INNER edge), tracked frame to frame, smoothed (median 5 + Gaussian 1.2). The asset (black ring inner
edge at 0.80 R) is warped onto that ellipse x SCALE so its ring lands on the old one: an oval when the arm turns (foreshortened), tilt from the fit.
NUDGE moves it along the arm toward the orange band's centre (fraction of the label->band offset); the old label left uncovered is inpainted.
    $OSPY tools/cutscenes/pb_trio47_patch.py UP.mp4 OUT.mp4 [--last=84] [--scale=1.25] [--nudge=0 (default; >0 smears the arm outline under the old label, see v47_trio.md)] [--ramp0=30] [--ramp1=36] [--debug=DIR]
Frames after --last are copied untouched (the hand covers the arm there; all past the 109.62 card cut at every shift)."""
import sys, os, json, subprocess, cv2, numpy as np
from scipy.ndimage import median_filter, binary_fill_holes
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
R = "/home/jade/Documents/vibesong/"
a = [x for x in sys.argv[1:] if not x.startswith('--')]; o = dict((x[2:].split('=', 1) + [''])[:2] for x in sys.argv[1:] if x.startswith('--'))
src, out = a[0], a[1]; LAST = int(o.get('last', 84)); SC = float(o.get('scale', 1.25)); NUDGE = float(o.get('nudge', 0.0)); dbg = o.get('debug')
if dbg: os.makedirs(dbg, exist_ok=True)
cap = cv2.VideoCapture(src); F = []
while True:
    ok, f = cap.read()
    if not ok: break
    F.append(f)
N = len(F)

# ---- 1. detect the ring's inner ellipse
def detect(f, cx, cy, Rr=70):
    x0, y0 = int(cx) - Rr, int(cy) - Rr; roi = f[y0:y0 + 2 * Rr, x0:x0 + 2 * Rr]
    g = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY); hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    D = cv2.morphologyEx((g < 100).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    holes = (binary_fill_holes(D) & (D == 0) & (hsv[..., 1] < 80)).astype(np.uint8)
    n, lab, st, cen = cv2.connectedComponentsWithStats(holes, 4)
    pts = []
    for i in range(1, n):
        if st[i, 4] < 6 or np.hypot(cen[i, 0] - Rr, cen[i, 1] - Rr) > 48: continue
        ys, xs = np.where(lab == i); pts.append(np.stack([xs, ys], 1))
    if not pts: return None
    P = np.concatenate(pts).astype(np.float32)
    if len(P) < 150: return None
    hull = cv2.convexHull(P)
    if len(hull) < 6: return None
    (ex, ey), (w, h), ang = cv2.fitEllipse(hull)
    if not (14 < min(w, h) < 80 and 30 < max(w, h) < 110): return None
    return [ex + x0, ey + y0, w, h, ang]
E = []; cx, cy = 1187.0, 768.0
for k in range(min(N, LAST + 1)):
    d = detect(F[k], cx, cy)
    E.append(d if d else [np.nan] * 5)
    if d: cx, cy = d[0], d[1]
E = np.array(E, np.float64); okm = ~np.isnan(E[:, 0]); print("detected", int(okm.sum()), "of", len(E))
# shape matrix Q = R diag((w/2)^2, (h/2)^2) R^T (no axis-labelling ambiguity as the oval turns), smoothed per entry; the asset is
# warped by M = sqrt(Q): upright text, squashed with the oval
def toQ(w, h, an):
    t = np.deg2rad(an); Rm = np.float64([[np.cos(t), -np.sin(t)], [np.sin(t), np.cos(t)]]); return Rm @ np.diag([(w / 2) ** 2, (h / 2) ** 2]) @ Rm.T
X = np.full((len(E), 5), np.nan)
for k, r in enumerate(E):
    if np.isnan(r[0]): continue
    Q = toQ(r[2], r[3], r[4]); X[k] = [r[0], r[1], Q[0, 0], Q[0, 1], Q[1, 1]]
idx = np.arange(len(E))
for j in range(5): X[:, j] = np.interp(idx, idx[okm], X[okm, j])
X = np.stack([median_filter(X[:, j], size=5, mode='nearest') for j in range(5)], 1)
X = np.stack([cv2.GaussianBlur(X[:, j].reshape(-1, 1), (1, 0), 1.2).ravel() for j in range(5)], 1)
def sqrtQ(k):
    Q = np.float64([[X[k, 2], X[k, 3]], [X[k, 3], X[k, 4]]]); ev, V = np.linalg.eigh(Q); ev = np.maximum(ev, 1)
    return V @ np.diag(np.sqrt(ev)) @ V.T, ev, V
S = []
for k in range(len(X)):
    _, ev, V = sqrtQ(k); an = np.degrees(np.arctan2(V[1, 0], V[0, 0])); S.append([X[k, 0], X[k, 1], 2 * np.sqrt(ev[0]), 2 * np.sqrt(ev[1]), an])
S = np.array(S)   # (cx, cy, w, h, angle) for masks / band search only

# ---- 2. the orange band's centre near the label (for the nudge): orange px in a disc around the label, centroid of the nearest band blob
def band_centre(f, cx, cy, w, h):
    Rr = int(max(w, h) * 1.3); x0, y0 = int(cx) - Rr, int(cy) - Rr; roi = f[y0:y0 + 2 * Rr, x0:x0 + 2 * Rr]
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 0] >= 5) & (hsv[..., 0] <= 22) & (hsv[..., 1] > 110) & (hsv[..., 2] > 120)).astype(np.uint8)
    yy, xx = np.mgrid[:2 * Rr, :2 * Rr]; m[np.hypot(xx - Rr, yy - Rr) > Rr] = 0
    if m.sum() < 80: return None
    ys, xs = np.where(m > 0); d = np.hypot(xs - Rr, ys - Rr); sel = d < np.percentile(d, 40)   # the band px nearest the label
    return xs[sel].mean() + x0, ys[sel].mean() + y0
B = np.array([band_centre(F[k], *S[k, :4]) or (np.nan, np.nan) for k in range(len(S))], np.float64)
bok = ~np.isnan(B[:, 0])
for j in range(2): B[:, j] = np.interp(idx, idx[bok], B[bok, j])
OFF = (B - S[:, :2]) * NUDGE
RAMP = (int(o.get('ramp0', 30)), int(o.get('ramp1', 36)))                 # nudge only in the reach (before it the label already sits across the band)
OFFW = np.clip((idx - RAMP[0]) / max(1, RAMP[1] - RAMP[0]), 0, 1)
OFF = np.stack([cv2.GaussianBlur(median_filter(OFF[:, j], size=7, mode='nearest').reshape(-1, 1), (1, 0), 2.0).ravel() for j in range(2)], 1)
OFF = OFF * OFFW[:, None]
if dbg: json.dump({'raw': np.where(np.isnan(E), None, E).tolist(), 'smooth': S.tolist(), 'band': B.tolist(), 'off': OFF.tolist()}, open(dbg + '/track.json', 'w'))

# ---- 3. composite
pp = cv2.imread(R + "inputs/sleeve_patch_1420MHz.png", cv2.IMREAD_UNCHANGED).astype(np.float32) / 255
SS = 4; PS = 400                                                          # asset rendered at 400 px, warped at SS x supersampling
pp = cv2.resize(pp, (PS, PS), interpolation=cv2.INTER_AREA); lum = pp[..., :3].mean(2); pal = pp[..., 3]
def layer(f, cx, cy, Mq, scale):
    Bx = int(np.abs(Mq).sum(1).max() * scale) + 6; bx0, by0 = int(cx) - Bx, int(cy) - Bx; BB = 2 * Bx
    # asset px (u, v) -> box px at SS: centre + R(t) diag(ax, ay)/(PS/2) (u - PS/2, v - PS/2)
    M = Mq * scale / (PS / 2) * SS
    T = np.float64([cx - bx0, cy - by0]) * SS - M @ np.float64([PS / 2, PS / 2])
    Mf = np.hstack([M, T[:, None]])
    L = cv2.warpAffine(lum, Mf, (BB * SS, BB * SS), flags=cv2.INTER_LINEAR, borderValue=0)
    A = cv2.warpAffine(pal, Mf, (BB * SS, BB * SS), flags=cv2.INTER_LINEAR, borderValue=0)
    L = cv2.resize(L, (BB, BB), interpolation=cv2.INTER_AREA); A = cv2.resize(A, (BB, BB), interpolation=cv2.INTER_AREA)
    reg = f[by0:by0 + BB, bx0:bx0 + BB].astype(np.float32)
    hsv = cv2.cvtColor(reg.astype(np.uint8), cv2.COLOR_BGR2HSV)
    wsel = (hsv[..., 1] < 45) & (hsv[..., 2] > 170) & (A < 0.05)          # jacket white just outside the patch
    white = np.median(reg[wsel], axis=0) if wsel.sum() > 30 else np.float32([228, 232, 240])
    dark = np.float32([42, 38, 48])
    tt = np.clip((L - 0.18) / (0.88 - 0.18), 0, 1)[..., None]
    col = dark * (1 - tt) + white * tt
    gr = cv2.cvtColor(reg.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
    grain = np.clip(gr / (cv2.GaussianBlur(gr, (0, 0), 2.5) + 1), 0.85, 1.12)[..., None]
    col = col * (1 + (grain - 1) * 0.6)
    col = cv2.GaussianBlur(col, (0, 0), 0.45)
    return col, A[..., None] * 0.97, (bx0, by0, BB)
def old_mask(f, cx, cy, w, h, an):   # the old label (ring outer edge ~ inner x 1.3), for the part the moved patch no longer covers
    m = np.zeros(f.shape[:2], np.uint8)
    cv2.ellipse(m, ((cx, cy), (w * 1.32, h * 1.32), an), 255, -1); return m
os.makedirs(R + "engine/out/dev/tmp", exist_ok=True)
tmpd = R + "engine/out/dev/tmp/v47trio_patch/"; os.makedirs(tmpd, exist_ok=True)
for k in range(N):
    f = F[k].copy()
    if k <= LAST:
        cx, cy, w, h, an = S[k]; nx, ny = cx + OFF[k, 0], cy + OFF[k, 1]
        if NUDGE > 0 and OFFW[k] > 0:
            # the part of the old label the moved patch no longer covers: jacket white + the frame's own grain (Telea smeared the text)
            om = old_mask(f, cx, cy, w, h, an); nm = np.zeros_like(om); cv2.ellipse(nm, ((nx, ny), (w * SC * 0.96, h * SC * 0.96), an), 255, -1)
            rest = cv2.dilate(((om > 0) & (nm == 0)).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)
            if rest.any():
                Bx = int(max(w, h)) + 10; x0, y0 = int(cx) - Bx, int(cy) - Bx; reg = f[y0:y0 + 2 * Bx, x0:x0 + 2 * Bx].astype(np.float32)
                hsv = cv2.cvtColor(reg.astype(np.uint8), cv2.COLOR_BGR2HSV); rr = rest[y0:y0 + 2 * Bx, x0:x0 + 2 * Bx]
                ws = (hsv[..., 1] < 45) & (hsv[..., 2] > 170) & (cv2.dilate((om[y0:y0 + 2 * Bx, x0:x0 + 2 * Bx] > 0).astype(np.uint8), np.ones((9, 9), np.uint8)) == 0)
                wm = np.median(reg[ws], axis=0) if ws.sum() > 30 else np.float32([228, 232, 240])
                gsh = cv2.cvtColor(np.roll(reg, -int(h), axis=0).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)   # grain from the white above
                grain = np.clip(gsh / (cv2.GaussianBlur(gsh, (0, 0), 2.5) + 1), 0.9, 1.08)[..., None]
                fill = wm * (1 + (grain - 1) * 0.6); al_ = cv2.GaussianBlur(rr, (0, 0), 1.0)[..., None]
                f[y0:y0 + 2 * Bx, x0:x0 + 2 * Bx] = np.clip(reg * (1 - al_) + fill * al_, 0, 255).astype(np.uint8)
        col, al, (bx0, by0, BB) = layer(f, nx, ny, sqrtQ(k)[0], SC)
        reg = f[by0:by0 + BB, bx0:bx0 + BB].astype(np.float32)
        f[by0:by0 + BB, bx0:bx0 + BB] = np.clip(reg * (1 - al) + col * al, 0, 255).astype(np.uint8)
        if dbg and k % 4 == 0:
            x0, y0 = int(cx) - 110, int(cy) - 110
            cv2.imwrite(f"{dbg}/ab_{k:03d}.jpg", np.hstack([F[k][y0:y0 + 220, x0:x0 + 220], f[y0:y0 + 220, x0:x0 + 220]]))
    cv2.imwrite(f"{tmpd}f_{k:05d}.png", f)
subprocess.run([FF, "-v", "error", "-y", "-framerate", "24", "-i", tmpd + "f_%05d.png", "-c:v", "libx264", "-crf", "10", "-preset", "slow",
                "-pix_fmt", "yuv420p", "-r", "24", out], check=True)
for x in os.listdir(tmpd): os.remove(tmpd + x)
os.rmdir(tmpd); print("wrote", out, N, "frames")
