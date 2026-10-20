"""v4.6 v46_outro: the v45r2 hybrid (pb_spread45_hybrid.py, copied verbatim for steps 1-4) with the SHOULDER seam fixed.
v4.5 cut at x~797 (max of the two ECC-tracked sleeve lines, then a vertical sky line x=800), so between take B's shoulder and that line
a strip of take B's sea met the re-run's hill / Ricky's shirt on a straight vertical edge (worst ~186.8-188.6).
v4.6, rows ~245-410 (neck, shoulder top, upper arm): the cut sits ON take B's own Jade outline, found per frame by a dynamic-programming
path along the darkest pencil line in polar coordinates around Jade's shoulder (centre CX,CY = 650,330, angle -62..22 deg = DP rows, radius = columns,
|dr|<=2 per 0.5 deg, temporal prior to the previous frame). The same DP finds the re-run's Jade outline; where it sits outside take B's
(up to ~20-45 px further out) take B's outer WB px band is stretched radially onto it (as v4.5 did along the sleeve only), and the cut
runs on that common outline: inside = take B's Jade, outside = the re-run's own background, drawn up to its Jade's shoulder (hill, sea,
Ricky's shirt), so no vertical edge is left. (Inpainting the gap instead was tried: it smeared.) Rows above 238 and the fan's ends (neck, below the sleeve band ~370-390) blend back into the v4.5 composite.
    $OSPY tools/cutscenes/pb_spread46_hybrid.py TAKE_B.mp4 RICKY_SRC.mp4 OUT.mp4 [--debug=DIR]
"""
import sys, os, subprocess, numpy as np, cv2
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
a_path, r_path, out = sys.argv[1:4]
opt = dict(a[2:].split('=', 1) for a in sys.argv[4:] if a.startswith('--'))
W, H = 1280, 720


def read(p):
    pr = subprocess.run([FF, "-v", "error", "-i", p, "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-"], capture_output=True, check=True)
    return np.frombuffer(pr.stdout, np.uint8).reshape(-1, H, W, 3)


A, R = read(a_path), read(r_path)
N = min(len(A), len(R)); print("frames", len(A), len(R), "->", N)
gray = lambda im: cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)
bgm = np.zeros((H, W), np.uint8); bgm[0:110, 160:1130] = 1; bgm[:, 0:230] = 1; bgm[60:300, 1050:1150] = 1   # background only
# 1. alignment
Ms = []
for k in range(N):
    M = np.eye(2, 3, dtype=np.float32)
    try:
        _, M = cv2.findTransformECC(gray(A[k]), gray(R[k]), M, cv2.MOTION_AFFINE, (3, 80, 1e-5), bgm, 5)
    except cv2.error:
        M = Ms[-1] if Ms else M
    Ms.append(M)
Ms = np.array(Ms)
Ms = np.stack([cv2.GaussianBlur(Ms[:, i, j].reshape(-1, 1).astype(np.float64), (1, 0), 3).ravel() for i in range(2) for j in range(3)], 1).reshape(N, 2, 3).astype(np.float32)
# 2. colour (background right of Jade, minus Ricky's box)
cm = np.zeros((H, W), bool); cm[30:300, 960:1160] = True; cm[0:90, 760:1150] = True
CG = []
for k in range(N):
    Rk = cv2.warpAffine(R[k], Ms[k], (W, H), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    a, b = A[k][cm].astype(np.float32), Rk[cm].astype(np.float32)
    CG.append([np.polyfit(b[:, c], a[:, c], 1) for c in range(3)])
CG = np.array(CG)                                                   # N x 3 x 2
CG = np.stack([cv2.GaussianBlur(CG[:, c, i].reshape(-1, 1), (1, 0), 6).ravel() for c in range(3) for i in range(2)], 1).reshape(N, 3, 2)
# 3. seam = take B's own Jade sleeve outline (frame-0 polyline, refined to the darkest pencil line, then tracked per frame by ECC
#    (euclidean) on the sleeve region, chained frame to frame), + 1 px; above the shoulder a vertical line TOPX in the sky (wide feather);
#    below the cuff a fixed line LOWX with take B's resting hand kept
TOPX, Y_TOP, Y_CUFF, LOWX = 800, 262, 522, 842
P0 = np.array([(772, 262), (779, 280), (781, 300), (784, 320), (786, 340), (787, 360), (789, 380), (793, 400), (795, 420), (797, 440),
               (800, 460), (802, 480), (807, 500), (812, 522)], np.float32)
ARM = np.array([(742, 270), (780, 268), (792, 360), (800, 440), (815, 522), (770, 522), (758, 440), (748, 360)], np.int32)
HAND = np.array([(778, 500), (830, 498), (872, 516), (880, 545), (790, 552), (770, 530)], np.int32)   # take B's resting hand (+ margin)
g0 = gray(A[0])
for i, (x, y) in enumerate(P0):                                     # snap to the darkest pixel of the outline (+-5 px)
    xi, yi = int(round(x)), int(round(y)); seg = g0[yi, xi - 5:xi + 6]; P0[i, 0] = xi - 5 + int(np.argmin(seg))
c2 = np.polyfit(P0[:, 1], P0[:, 0], 2); P0[:, 0] = np.polyval(c2, P0[:, 1])   # smooth the snapped outline (quadratic in y)
print("P0 snapped+fit", P0[:, 0].round(1).tolist())
armm = np.zeros((H, W), np.uint8); cv2.fillPoly(armm, [ARM], 1); armm = cv2.dilate(armm, np.ones((9, 9), np.uint8))
from scipy.ndimage import gaussian_filter1d
yy = np.arange(H, dtype=np.float32)


def track(frames):
    """seam (N x H) along Jade's sleeve outline in this clip: P0 tracked by chained ECC on the arm region"""
    T = [np.eye(2, 3, dtype=np.float32)]
    for k in range(1, N):
        M = T[-1].copy()
        try:
            _, M = cv2.findTransformECC(g0, frames(k), M, cv2.MOTION_EUCLIDEAN, (3, 100, 1e-5), armm, 5)
        except cv2.error:
            pass
        T.append(M)
    T = gaussian_filter1d(np.array(T), 1.0, axis=0)                   # light temporal smoothing (~1 frame)
    S = np.zeros((N, H), np.float32)
    for k in range(N):
        P = P0 @ T[k][:, :2].T + T[k][:, 2]
        P = P[np.argsort(P[:, 1])]
        s = np.interp(yy, P[:, 1], P[:, 0]) + 1.0
        t = np.clip((P[0, 1] - yy) / 25, 0, 1); s = s * (1 - t) + TOPX * t      # ramp into the sky line above the shoulder
        t2 = np.clip((yy - P[-1, 1]) / 18, 0, 1); s = s * (1 - t2) + LOWX * t2
        S[k] = s
    return S


def aligned(k):
    Rk = cv2.warpAffine(R[k], Ms[k], (W, H), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
    for c in range(3): Rk[..., c] = Rk[..., c] * CG[k, c, 0] + CG[k, c, 1]
    return Rk


seamsA = track(lambda k: gray(A[k]))
seamsR = track(lambda k: gray(np.clip(aligned(k), 0, 255).astype(np.uint8)))
seams = np.maximum(seamsA, seamsR)        # the cut sits right of BOTH Jades' sleeves; take B's sleeve is stretched to it (no ghost)
feath = np.full(H, 2.0, np.float32); feath[:Y_TOP - 30] = 22.0; feath[Y_TOP - 30:Y_TOP] = np.linspace(22, 2, 30)
print("seam x at y=400: take B", seamsA[:, 400].min().round(1), seamsA[:, 400].max().round(1), "| Ricky clip", seamsR[:, 400].min().round(1), seamsR[:, 400].max().round(1),
      "| max stretch px", (seamsR - seamsA).max().round(1))
BAND = 24.0
xs = np.arange(W, dtype=np.float32)[None, :]
hand = np.zeros((H, W), np.uint8); cv2.fillPoly(hand, [HAND], 255); hand = cv2.GaussianBlur(hand.astype(np.float32) / 255, (0, 0), 3)
mapy = None
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
enc = subprocess.Popen([FF, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "24", "-i", "-",
                        "-c:v", "libx264", "-crf", "10", "-preset", "slow", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
dbg = opt.get('debug')
if dbg: os.makedirs(dbg, exist_ok=True)
# ---- v4.6: Jade's outline (neck -> shoulder -> upper arm) in both clips, polar DP ----
CX, CY = 650, 330
TH0, TH1 = -62, 22
TH = np.deg2rad(np.arange(TH0, TH1 + 0.01, 0.5)); RR = np.arange(50, 280, 1.0)
PMX = (CX + RR[None, :] * np.cos(TH[:, None])).astype(np.float32); PMY = (CY + RR[None, :] * np.sin(TH[:, None])).astype(np.float32)
KER = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))


def lineness(f):
    L = cv2.cvtColor(np.clip(f, 0, 255).astype(np.uint8), cv2.COLOR_BGR2LAB)[..., 0].astype(np.float32)
    return cv2.GaussianBlur(cv2.morphologyEx(L, cv2.MORPH_BLACKHAT, KER), (0, 0), 0.8)


def dp(C):
    n, m = C.shape; D = C.copy(); Bk = np.zeros((n, m), int)
    for i in range(1, n):
        best = np.full(m, 1e9); arg = np.zeros(m, int)
        for d in (-2, -1, 0, 1, 2):
            sh = np.roll(D[i - 1], d)
            if d > 0: sh[:d] = 1e9
            if d < 0: sh[d:] = 1e9
            pen = sh + 0.3 * abs(d); better = pen < best; best = np.where(better, pen, best); arg = np.where(better, np.arange(m) - d, arg)
        D[i] = C[i] + best; Bk[i] = arg
    j = int(np.argmin(D[-1])); p = [j]
    for i in range(n - 1, 0, -1): j = Bk[i, j]; p.append(j)
    return RR[np.array(p[::-1])]


def outline(frames):
    out, prev = [], None
    for k in range(N):
        C = -cv2.remap(lineness(frames(k)), PMX, PMY, cv2.INTER_LINEAR)
        if prev is not None: C = C + 0.8 * np.clip(np.abs(RR[None, :] - prev[:, None]) - 2, 0, None)
        prev = dp(C); out.append(prev)
    return gaussian_filter1d(np.array(out), 0.7, axis=0)


rA = outline(lambda k: A[k])
rR = outline(lambda k: aligned(k))
print("outline radius take B", rA.min().round(1), rA.max().round(1), "| re-run outside take B by up to", np.round((rR - rA).max(), 1), "px (polar)")
# per-row right edge of Jade (rows BY0..BY1) from the polar outline: rasterise outline + centre, take the right-most pixel per row
BY0, BY1, BX0, BX1 = 225, 410, 660, 900
SL = 80.0                                                             # the re-run background slide decays over SL px right of the cut
wr = np.clip(np.minimum((np.arange(BY0, BY1) - 236) / 12.0, (402 - np.arange(BY0, BY1)) / 16.0), 0, 1)


def edges(r):
    pts = np.stack([CX + r * np.cos(TH), CY + r * np.sin(TH)], 1)
    poly = np.vstack([[CX - 60, CY + 120], [CX - 60, pts[0, 1]], pts, [pts[-1, 0] - 40, CY + 120]]).round().astype(np.int32)
    mk = np.zeros((H, W), np.uint8); cv2.fillPoly(mk, [poly], 1)
    e = np.full(BY1 - BY0, np.nan, np.float32)
    for j, y in enumerate(range(BY0, BY1)):
        xs_ = np.where(mk[y, 600:900])[0]
        if len(xs_) and y >= pts[:, 1].min() + 3: e[j] = 600 + xs_.max() + 1
    ok = np.isfinite(e)
    if ok.sum() > 5: e[ok] = cv2.medianBlur(e[ok].reshape(-1, 1).astype(np.float32), 5).ravel() if ok.sum() > 0 else e[ok]
    return e


for k in range(N):
    Rk = aligned(k)
    # stretch take B's outer sleeve band [sA-BAND, sA] onto [sA-BAND, s] where the Ricky clip's Jade sits further right
    sA, s = seamsA[k][:, None], seams[k][:, None]
    lo = sA - BAND; f = np.clip((xs - lo) / np.maximum(s - lo, 1e-3), 0, 1)
    mapx = np.where((xs > lo) & (xs <= s + 2), lo + f * (sA - lo), xs).astype(np.float32)
    mapx = np.where(xs > s + 2, xs, mapx).astype(np.float32)
    Ak = cv2.remap(A[k], mapx, np.repeat(yy[:, None], W, 1), cv2.INTER_LINEAR).astype(np.float32)
    m = np.clip((xs - seams[k][:, None]) / feath[:, None] + 0.5, 0, 1) * (1 - hand)
    o = Ak * (1 - m[..., None]) + Rk * m[..., None]
    o = np.clip(o, 0, 255).astype(np.uint8)
    # v4.6 shoulder composite: cut ON take B's outline; the re-run's background is slid left (per row, decaying over SL px) so the
    # strip it drew next to ITS Jade lands next to take B's Jade (Jade herself is never warped)
    eA, eR = edges(rA[k]), edges(rR[k]); Rk_full = Rk
    rows_ = np.arange(BY0, BY1)
    lnA = lineness(A[k])                                              # shoulder top (rows < 300): the DP can sit on the stripe's inner line;
    for j, y in enumerate(rows_):                                     # move the cut out to the OUTER pencil line (rightmost strong dark px within +12)
        if y >= 300 or not np.isfinite(eA[j]): continue
        x0 = int(eA[j]) - 2; seg = lnA[y, x0:x0 + 15]
        if seg.max() > 8: eA[j] = x0 + np.where(seg >= 0.5 * seg.max())[0].max() + 2
    low = rows_ >= 300                # on the sleeve: never inside the v4.5 tracked sleeve lines (DP can jump onto the band)
    eA = np.where(low & np.isfinite(eA), np.maximum(eA, seamsA[k][rows_] - 4), eA); eR = np.where(low & np.isfinite(eR), np.maximum(eR, seamsR[k][rows_] - 4), eR)
    eRm = np.where(np.isfinite(eR), eR, -1e4); eRm = np.array([eRm[max(0, j - 5):j + 6].max() for j in range(len(eRm))])   # re-run Jade: widest within +-5 rows
    valid = np.isfinite(eA) & (eRm > 0)
    run = np.zeros(len(valid)); c = 0
    for j in range(len(valid)): c = c + 1 if valid[j] else 0; run[j] = c
    wk = wr * np.clip(run / 12.0, 0, 1)                               # ramp in from the first row with a valid outline (no hard line)
    D = np.where(valid, np.maximum(0.0, eRm - np.nan_to_num(eA)) + 3.0, 0.0)
    D = np.array([D[max(0, j - 3):j + 4].max() for j in range(len(D))]); D = gaussian_filter1d(D, 2.5)   # slide: smooth over rows (no tears)
    oldb = o[BY0:BY1, BX0:BX1].astype(np.float32); newb = oldb.copy()
    for j, y in enumerate(range(BY0, BY1)):
        if not valid[j] or wk[j] <= 0: continue
        dd = D[j]
        xx = np.arange(W, dtype=np.float32)
        src = xx + dd * np.clip(1 - (xx - eA[j]) / SL, 0, 1)
        rowR = np.stack([np.interp(src, xx, Rk_full[y, :, c]) for c in range(3)], 1)
        m = (np.clip((xx - eA[j]) / 1.5 + 0.5, 0, 1) * np.clip((xx - 735) / 6, 0, 1))[:, None]   # never re-run left of x~738 (its chin/hair)
        rowN = A[k][y].astype(np.float32) * (1 - m) + rowR * m
        newb[j] = rowN[BX0:BX1]
    w = wk[:, None, None]
    o[BY0:BY1, BX0:BX1] = np.clip(oldb * (1 - w) + newb * w, 0, 255).astype(np.uint8)
    enc.stdin.write(o.tobytes())
    if dbg and k % 6 == 0:
        d = np.hstack([oldb.astype(np.uint8), np.full((BY1 - BY0, 4, 3), 255, np.uint8), o[BY0:BY1, BX0:BX1]])
        cv2.imwrite(f"{dbg}/sh_{k:03d}.jpg", cv2.resize(d, None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST), [cv2.IMWRITE_JPEG_QUALITY, 88])
enc.stdin.close(); enc.wait()
np.savez_compressed(os.path.splitext(out)[0] + "_outlines.npz", rA=rA, rR=rR, TH=TH, C=np.array([CX, CY]))
print("wrote", out)
