"""v4.5 v45_ricky: keep take B (Jade, Charlie, the page) and take Ricky from a re-run that started from the fixed still (ff_r1).
Per frame (720p, 24 fps, both clips 217 frames from near-identical first frames):
  1. align the Ricky clip to take B (ECC affine on the background: sky band, left page, far right), temporally smoothed;
  2. colour-match it (per-channel linear fit on the background right of Jade), temporally smoothed;
  3. seam: x = TOPX above Jade's shoulder; along take B's own Jade sleeve outline (per row: end of the white sleeve run scanning right
     from inside the sleeve), median-smoothed over rows and frames; below the cuff a fixed line, with take B's resting hand kept;
  4. out = take B left of the seam, Ricky clip right of it (2 px feather).
    $OSPY tools/cutscenes/pb_spread45_hybrid.py TAKE_B.mp4 RICKY_SRC.mp4 OUT.mp4 [--debug=DIR]"""
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
    enc.stdin.write(o.tobytes())
    if dbg and k % 24 == 6:
        d = o.copy(); pts = np.stack([seams[k], np.arange(H)], 1).astype(np.int32); cv2.polylines(d, [pts], False, (0, 0, 255), 1)
        cv2.imwrite(f"{dbg}/f{k:03d}.jpg", d[60:660, 600:1100], [cv2.IMWRITE_JPEG_QUALITY, 90])
enc.stdin.close(); enc.wait()
print("wrote", out, "colour gains (mean)", CG.mean(0).round(3).tolist())
