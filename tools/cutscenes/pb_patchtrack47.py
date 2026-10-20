"""v4.7 (unit v47_cards): keep card 06's sleeve patch a clean, readable round 1420 MHz patch in every frame of a take.
Seedance redraws the patch as gibberish at 480p; we track the patch disc in each frame and paste the clean drawn patch from the
first-frame still (tools/cutscenes/pb_patch47.py) over it, following its centre, size and rotation.
    $OSPY tools/cutscenes/pb_patchtrack47.py IN.mp4 FF.png CX CY R OUT.mp4 [--debug DIR]
CX CY R = the patch in FF (1920x1080 px). IN is any resolution / fps (output keeps them). Tracking (v2, see the code): ring+disc template match; (v1 was LK on the sleeve ring around
the patch (r 1.3-2.6 R) give a similarity per frame (relative to frame 0, chained with re-seeding), refined by a Hough circle search near
the prediction; centre/scale/rotation are smoothed (centred 5-frame median + 3-frame mean). Logs per-frame centre/radius to OUT.json."""
import sys, json, subprocess, numpy as np, cv2
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
inp, ffp, cx, cy, R, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), sys.argv[6]
dbg = sys.argv[sys.argv.index("--debug") + 1] if "--debug" in sys.argv else None
cap = cv2.VideoCapture(inp); fps = cap.get(cv2.CAP_PROP_FPS); frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
H, W = frames[0].shape[:2]; s = W / 1920.0; cx, cy, R = cx * s, cy * s, R * s
# (v3) --ff FX FY FR: the patch in the still (sprite source), when it differs from the take's frame-0 patch CX CY R
if "--ff" in sys.argv:
    i = sys.argv.index("--ff"); fx, fy, fR = (float(v) * s for v in sys.argv[i + 1:i + 4])
else: fx, fy, fR = cx, cy, R
ff = cv2.resize(cv2.imread(ffp), (W, H), interpolation=cv2.INTER_AREA)
# clean patch sprite (disc incl. its ring), cut from the still
rr = fR * 1.18; x0, y0 = int(fx - rr * 1.6), int(fy - rr * 1.6); x1, y1 = int(fx + rr * 1.6), int(fy + rr * 1.6)
spr = ff[y0:y1, x0:x1].astype(np.float32); sc = np.array([fx - x0, fy - y0])
yy, xx = np.mgrid[0:spr.shape[0], 0:spr.shape[1]]; d = np.hypot(xx - sc[0], yy - sc[1])
smask = np.clip((rr + 1.5 - d) / 3.0, 0, 1).astype(np.float32)
gray = [cv2.GaussianBlur(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (0, 0), 1.0 * s / 0.445 * 0.5 + 0.5) for f in frames]
# (v2) LK on the sleeve latched onto her hand when it crossed the arm. Now: track the take's OWN patch disc (white disc + dark ring, whatever
# its garbled text) by normalised template matching of a synthetic ring+disc at 5 scales inside a window around the last position.
# A low score = occluded (hand/hair over it): the paste fades out there instead of drawing over the hand.
T0 = gray[0][int(cy - R * 1.3):int(cy + R * 1.3), int(cx - R * 1.3):int(cx + R * 1.3)].astype(np.float32)   # the take's own patch at frame 0
def ring_tmpl(r):
    n = max(7, int(round(T0.shape[0] * r / R))); return cv2.resize(T0, (n, n), interpolation=cv2.INTER_AREA)
C, S, A, Q = [], [], [], []; c = np.array([cx, cy]); sk = 1.0
lost = 0; ADAPT = '--adapt' in sys.argv
QMIN = float(sys.argv[sys.argv.index('--qmin') + 1]) if '--qmin' in sys.argv else 0.6
for k in range(len(frames)):
    best = (-1, None, None)
    for sc_ in (0.88, 0.94, 1.0, 1.06, 1.12, 1.2):
        r = R * sc_                                   # absolute scale range (relative compounding collapsed to tiny templates)
        t = ring_tmpl(r); win = int(R * (2.5 if lost < 3 else 4.5)) + t.shape[0] // 2
        X0, Y0 = int(max(0, c[0] - win)), int(max(0, c[1] - win)); X1, Y1 = int(min(W, c[0] + win)), int(min(H, c[1] + win))
        sub = gray[k][Y0:Y1, X0:X1].astype(np.float32)
        if sub.shape[0] <= t.shape[0] or sub.shape[1] <= t.shape[1]: continue
        m = cv2.matchTemplate(sub, t, cv2.TM_CCOEFF_NORMED); _, mv, _, ml = cv2.minMaxLoc(m)
        if mv > best[0]: best = (mv, np.array([X0 + ml[0] + t.shape[1] // 2, Y0 + ml[1] + t.shape[0] // 2], float), r / R)
    q = best[0]
    ok_ = best[1] is not None and q > QMIN and np.hypot(*(best[1] - c)) < R * (1.2 if lost < 3 else 4.0)
    lost = 0 if ok_ else lost + 1
    if ok_ and ADAPT:   # (v3) adaptive template (off by default: it drifted onto the hand): the redrawn patch slowly changes shape/text, follow it
        cur = cv2.getRectSubPix(gray[k], (T0.shape[1], T0.shape[0]), (float(c[0]), float(c[1]))).astype(np.float32); T0 = 0.7 * T0 + 0.3 * cur
    if ok_: c, sk = best[1], best[2]
    C.append(c.copy() if ok_ else np.array([np.nan, np.nan])); S.append(sk if ok_ else np.nan); A.append(0.0); Q.append(q)
Q = np.array(Q); C = np.array(C); S = np.array(S); good = ~np.isnan(S); idx = np.arange(len(S))
for j in range(2): C[:, j] = np.interp(idx, idx[good], C[good, j])   # (v3) weak/jumpy matches are dropped and the centre is interpolated
S = np.interp(idx, idx[good], S[good]); Q = np.where(good, Q, np.interp(idx, idx[good], Q[good]))
C, S, A = np.array(C), np.array(S), np.array(A)
def smooth(v):
    v = np.asarray(v, float); p = np.pad(v, [(2, 2)] + [(0, 0)] * (v.ndim - 1), mode="edge")
    med = np.stack([np.median(p[i:i + 5], axis=0) for i in range(len(v))]); p = np.pad(med, [(1, 1)] + [(0, 0)] * (v.ndim - 1), mode="edge")
    return np.stack([p[i:i + 3].mean(0) for i in range(len(v))])
C, S, A = smooth(C), smooth(S), smooth(A)
V = np.clip((smooth(Q) - (QMIN - 0.25)) / 0.15, 0, 1)
# (v3) --keys "K:X,Y,VIS;..." hand-keyed patch centres (full-frame 1920 px) + visibility, from the first key on: centre/visibility are
# interpolated between the last tracked frame before the first key and the keys (the tracker loses the patch as it slides under her hair).
if "--keys" in sys.argv:
    ks = [(int(a), *map(float, b.split(","))) for a, b in (kv.split(":") for kv in sys.argv[sys.argv.index("--keys") + 1].split(";"))]
    k0 = ks[0][0] - 4; ax = [k0] + [k for k, *_ in ks]; X = [C[k0][0]] + [x * s for _, x, y, v in ks]; Y = [C[k0][1]] + [y * s for _, x, y, v in ks]
    Vv = [V[k0]] + [v for *_, v in ks]
    for k in range(k0, len(frames)):
        C[k] = [np.interp(k, ax, X), np.interp(k, ax, Y)]; V[k] = np.interp(k, ax, Vv)
# (v3) --hide "A-B,..." frames where her hand covers the patch: no paste (the take's own covered patch shows)
if "--hide" in sys.argv:
    for rg in sys.argv[sys.argv.index("--hide") + 1].split(","):
        a_, b_ = map(int, rg.split("-")); V[a_:b_ + 1] = 0
pr = subprocess.Popen([FF, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", f"{fps}", "-i", "-",
                       "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "14", "-preset", "slow", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
log = []
for k, f in enumerate(frames):
    M = cv2.getRotationMatrix2D((float(sc[0]), float(sc[1])), -A[k], S[k] * R / fR); M[:, 2] += C[k] - sc
    w = cv2.warpAffine(spr, M, (W, H), flags=cv2.INTER_CUBIC); m = cv2.warpAffine(smask, M, (W, H), flags=cv2.INTER_LINEAR)[..., None] * float(V[k])
    o = (f.astype(np.float32) * (1 - m) + w * m).clip(0, 255).astype(np.uint8); pr.stdin.write(o.tobytes())
    log.append(dict(k=k, cx=round(float(C[k][0]) / s, 1), cy=round(float(C[k][1]) / s, 1), scale=round(float(S[k]), 3), rot=round(float(A[k]), 2), q=round(float(Q[k]), 3), vis=round(float(V[k]), 2)))
    if dbg and k % 10 == 0:
        z = np.hstack([f[int(C[k][1] - 3 * R):int(C[k][1] + 3 * R), int(C[k][0] - 3 * R):int(C[k][0] + 3 * R)],
                       o[int(C[k][1] - 3 * R):int(C[k][1] + 3 * R), int(C[k][0] - 3 * R):int(C[k][0] + 3 * R)]])
        if z.size: cv2.imwrite(f"{dbg}/patch_{k:03d}.jpg", z)
pr.stdin.close(); pr.wait(); json.dump(log, open(out + ".json", "w")); print(out, len(frames), "frames")
