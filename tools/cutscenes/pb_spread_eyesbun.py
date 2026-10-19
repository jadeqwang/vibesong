"""v4 Pass B paper, Task C3: Jade's EYES and BUN + PENCILS from the approved v11 still onto the living right-page layer (v12 Veo take t2),
frame by frame, so (1) she is not cross-eyed (Veo t2 drew sclera-less eyes with the catchlights converging) and (2) the pencils stay the
still's clean X with both caps up (Veo swung the pink cap horizontal-left, the blue horizontal-right, and later grew a third end).
    $OSPY tools/cutscenes/pb_spread_eyesbun.py SRC_NAME OUT_NAME [--frames=14-125] [--debug=DIR] [--noeyes] [--nobun]
Reads media/act5/frames/SRC_NAME/1080 (the stabilized take, registered to the still), writes media/act5/frames/OUT_NAME/1080 (only --frames).
- Head: rigid similarity (still -> frame) from FaceMesh forehead / temple / eye-corner / nose-bridge points, smoothed over time.
- Pencils out: pencil-coloured pixels (saturated yellow body, orange wood, pink and blue caps, + their outlines) in a head-top ROI,
  outside the face oval, are Telea-inpainted from the sky / hair around them.
- Bun + pencils in: the still's bun (ellipse) and both pencils (thin bands along each visible segment) are warped by the head similarity
  and pasted with a feathered mask, after a per-channel gain match on a ring (no halo).
- Eyes in: each of the still's eyes (contour hull + 6 px) is warped by a full affine from the 16 eye-contour landmarks (so it follows the
  lids when she squints) and pasted with a feathered mask over the union of both hulls; weight fades out as the eye closes
  (FaceMesh openness 0.10 -> 0.17), so Veo's own closed / laughing eyes stay."""
import sys, os, glob, json, numpy as np, cv2, mediapipe as mp
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); J = lambda *p: os.path.join(ROOT, *p)
args = [a for a in sys.argv[1:] if not a.startswith('--')]; opt = dict((a[2:].split('=') + [''])[:2] for a in sys.argv[1:] if a.startswith('--'))
src, outn = args
a0, _, b0 = opt.get('frames', '14-125').partition('-'); RNG = list(range(int(a0), int(b0) + 1))
STILL = cv2.resize(cv2.imread(J('media/act5/stills/spread_right_crop_v11.jpg')), (1920, 1080), interpolation=cv2.INTER_AREA).astype(np.float32)
C = (800, 140, 1200, 540)
HEAD = [10, 151, 9, 8, 168, 6, 109, 338, 67, 297, 103, 332, 54, 284, 33, 133, 362, 263, 21, 251]
EYES = [[33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246], [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]]
OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
# the still's bun + pencils, in still (= frame) 1080 px: bun ellipse and the visible pencil segments (centre lines), measured on the still
BUN = ((1052, 258), (31, 25))
PENCILS = [((985, 231), (1023, 266), 11), ((1108, 239), (1069, 279), 11)]   # the two cap ends
PENCIL_LOW = ((1086, 311), (1125, 353), 12)   # the blue pencil's lower end by the ear, as in the approved still (pasted colour-tight)


def mesh(det, img):
    c = img[C[1]:C[3], C[0]:C[2]]; big = cv2.resize(c, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
    r = det.process(cv2.cvtColor(big, cv2.COLOR_BGR2RGB))
    return None if not r.multi_face_landmarks else np.array([[p.x * 400 + C[0], p.y * 400 + C[1]] for p in r.multi_face_landmarks[0].landmark])


def openness(l, e):
    up, lo, c0, c1 = ((159, 145, 33, 133), (386, 374, 362, 263))[e]
    return np.linalg.norm(l[up] - l[lo]) / np.linalg.norm(l[c0] - l[c1])


LS = mesh(mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3), STILL.astype(np.uint8))
assert LS is not None
OS = [openness(LS, 0), openness(LS, 1)]
H, W = 1080, 1920
# still-space masks
bunm = np.zeros((H, W), np.uint8); cv2.ellipse(bunm, BUN[0], BUN[1], 0, 0, 360, 1, -1)
penm = np.zeros((H, W), np.uint8)
for p0, p1, wd in PENCILS: cv2.line(penm, p0, p1, 1, wd, cv2.LINE_AA)
# paste only what is drawn: the bun's hair inside the ellipse and the pencil bands (the still's sky around them is never pasted)
_sv = STILL.mean(-1); bunm = bunm & (_sv < 140).astype(np.uint8); bunm = cv2.morphologyEx(bunm, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
_hsv = cv2.cvtColor(STILL.astype(np.uint8), cv2.COLOR_BGR2HSV_FULL).astype(np.float32); _H, _S = _hsv[..., 0] * 360 / 255, _hsv[..., 1] / 255
lowb = np.zeros((H, W), np.uint8); cv2.line(lowb, PENCIL_LOW[0], PENCIL_LOW[1], 1, PENCIL_LOW[2], cv2.LINE_AA)
lowc = ((_H > 12) & (_H < 55) & (_S > 0.35)) | (_sv > 200)                           # wood / yellow / pale tip
if 'pastelow' in opt: penm = np.maximum(penm, lowb & cv2.dilate(lowc.astype(np.uint8), np.ones((5, 5), np.uint8)))   # off: it floats off the head in the 3/4 turn (canon: tips hidden)
pastem = np.maximum(bunm, penm).astype(np.float32)
pastem = cv2.GaussianBlur(cv2.dilate(pastem, np.ones((3, 3), np.uint8)), (0, 0), 1.3)
# --- (v13b) pencils-only paste: warp ONCE from the full-res still (Lanczos, light prefilter), tight colour+outline pencil mask that
#     stops at the still's bun silhouette; the Veo bun is kept and its strands occlude the pencils where they enter it
FULL = cv2.imread(J('media/act5/tex/spread_full_v11.jpg')).astype(np.float32)
RXY = np.array([0.4440406976744186 * 5504, 0.23502604166666666 * 3072]); S0 = 1920 / (0.5559593023255814 * 5504)
FULLp = cv2.GaussianBlur(FULL, (0, 0), 0.45 / S0)                                     # anti-alias for the ~0.63x downscale
_bunsil = cv2.dilate(bunm, np.ones((3, 3), np.uint8))
_colS = (((_H > 28) & (_H < 58) & (_S > 0.5) & (_sv > 150)) | ((_H > 12) & (_H <= 28) & (_S > 0.5)) |
         (((_H < 12) | (_H > 330)) & (_S > 0.3)) | ((_H > 185) & (_H < 235) & (_S > 0.3)))
_dark = _sv < 120
PEN_BAND = np.zeros((H, W), np.uint8); PEN_IN = np.zeros((H, W), np.uint8)
for p0, p1, wd in PENCILS:
    cv2.line(PEN_BAND, p0, p1, 1, wd + 4)
    q = (np.array(p0) * 0.35 + np.array(p1) * 0.65).astype(int); cv2.line(PEN_IN, tuple(q), p1, 1, wd + 8)   # inner 35 % (bun end)
penT = PEN_BAND & cv2.dilate((_colS | (_dark & (cv2.dilate(_colS.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0))).astype(np.uint8), np.ones((2, 2), np.uint8))
penT = cv2.morphologyEx(penT, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)) & (1 - _bunsil)
eyem = []
for e in EYES:
    m = np.zeros((H, W), np.uint8); cv2.fillConvexPoly(m, cv2.convexHull(LS[e].astype(np.int32)), 1); eyem.append(cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 11))))

GRAIN = STILL - cv2.GaussianBlur(STILL, (0, 0), 2.0)                                # the page's own grain (camera is locked to it)
_notsky = cv2.dilate(((_sv < 175) | (_S > 0.5)).astype(np.uint8), np.ones((9, 9), np.uint8))          # any drawn line in the still
GRAIN = np.clip(GRAIN, -8, 8) * (1 - np.maximum(cv2.dilate(np.maximum(np.maximum(bunm, penm), lowb), np.ones((15, 15), np.uint8)), _notsky))[..., None]
files = {k: J('media/act5/frames', src, '1080', f'f_{k:05d}.jpg') for k in RNG}
det = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3)
LM = {}
for k in RNG: LM[k] = mesh(det, cv2.imread(files[k]))
miss = [k for k in RNG if LM[k] is None]; print('faces', len(RNG) - len(miss), '/', len(RNG), 'missing', miss)
for k in miss: LM[k] = LM[min((j for j in RNG if LM[j] is not None), key=lambda j: abs(j - k))]
# head similarity per frame, smoothed (5-tap)
P = np.array([cv2.estimateAffinePartial2D(LS[HEAD].astype(np.float32), LM[k][HEAD].astype(np.float32), method=cv2.LMEDS)[0].ravel() for k in RNG])
ker = np.array([1, 2, 3, 2, 1], float); ker /= ker.sum()
P = np.stack([np.convolve(np.pad(P[:, c], 2, mode='edge'), ker, 'valid') for c in range(6)], 1)
# eye affines: smooth the eye landmarks a little (3-tap) first
# the bun itself: Veo moves it with yaw (3/4 turn) more than the face landmarks say, so find it: masked template match of the
# still's bun (warped by the head similarity) against the frame, +-36 px around the prediction; offsets smoothed (5-tap)
_g = lambda img: cv2.cvtColor(img.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
BOFF = []
for i, k in enumerate(RNG):
    M = P[i].reshape(2, 3); a_f = M @ np.array([BUN[0][0], BUN[0][1], 1.0])
    Sw = _g(cv2.warpAffine(STILL, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT))
    mk = cv2.warpAffine(bunm.astype(np.float32), M, (W, H), flags=cv2.INTER_NEAREST)
    rx, ry = BUN[1][0] + 6, BUN[1][1] + 6; ax_, ay_ = int(round(a_f[0])), int(round(a_f[1]))
    tpl = Sw[ay_ - ry:ay_ + ry, ax_ - rx:ax_ + rx]; tm = mk[ay_ - ry:ay_ + ry, ax_ - rx:ax_ + rx]
    R_ = 36; win = _g(cv2.imread(files[k]))[ay_ - ry - R_:ay_ + ry + R_, ax_ - rx - R_:ax_ + rx + R_]
    res = cv2.matchTemplate(win, tpl, cv2.TM_SQDIFF, mask=tm); _, _, mn, _ = cv2.minMaxLoc(res)
    BOFF.append((mn[0] - R_, mn[1] - R_))
BOFF = np.array(BOFF, float)
BOFF = np.stack([np.convolve(np.pad(BOFF[:, c], 2, mode='edge'), ker, 'valid') for c in range(2)], 1)
print('bun offset vs landmark prediction (px): median', np.round(np.median(BOFF, 0), 1), 'max |dx|', np.round(np.abs(BOFF[:, 0]).max(), 1))
def bunM(i):
    M = P[i].reshape(2, 3); sc = np.sqrt(abs(np.linalg.det(M[:, :2]))); th = np.arctan2(M[1, 0], M[0, 0]) * float(opt.get('rotk', 0.35))
    a_s = np.array(BUN[0], float); a_f = M @ np.array([a_s[0], a_s[1], 1.0]) + BOFF[i]
    R2 = sc * np.array([[np.cos(th), -np.sin(th)], [np.sin(th), np.cos(th)]]); return np.hstack([R2, (a_f - R2 @ a_s)[:, None]])
# (v13b) pencil source = Veo's OWN pencils in a frame where they are a clean X with both caps up (--pencilref, default src 14):
# same line weight, saturation and style as the rest of the layer; only the two cap ends above the bun are taken
PREF = int(opt.get('pencilref', RNG[0]))
if 'pencilsonly' in opt:
    _Fr = cv2.imread(files[PREF]).astype(np.float32); _hv = cv2.cvtColor(_Fr.astype(np.uint8), cv2.COLOR_BGR2HSV_FULL).astype(np.float32)
    _h, _s_, _v = _hv[..., 0] * 360 / 255, _hv[..., 1] / 255, _hv[..., 2] / 255
    _c = (((_h > 28) & (_h < 58) & (_s_ > 0.5) & (_v > 0.62)) | ((_h > 12) & (_h <= 28) & (_s_ > 0.55) & (_v > 0.55)) |
          (((_h < 12) | (_h > 330)) & (_s_ > 0.35) & (_v > 0.55)) | ((_h > 185) & (_h < 235) & (_s_ > 0.35) & (_v > 0.3))).astype(np.uint8)
    _Mr = bunM(RNG.index(PREF)); _bc = _Mr @ np.array([BUN[0][0], BUN[0][1], 1.0])
    _top = np.zeros((H, W), np.uint8); _top[int(_bc[1] - 90):int(_bc[1] + float(opt.get("topcut", 4))), int(_bc[0] - 110):int(_bc[0] + 110)] = 1
    _c = cv2.morphologyEx(_c & _top, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    n_, lab_, st_, cen_ = cv2.connectedComponentsWithStats(_c)
    keepc = [j for j in range(1, n_) if st_[j, 4] > 40]
    _c = np.isin(lab_, keepc).astype(np.uint8)
    _lr = _Fr.mean(-1); _hairr = cv2.morphologyEx((_lr < 100).astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))   # thick hair = the bun
    # each pencil = a solid band along its own axis (shaded half + outline included), from the cap end to where it enters the bun
    PSRC_M = np.zeros((H, W), np.uint8); yy_, xx_ = np.where(_c > 0)
    for side in (xx_ < _bc[0], xx_ >= _bc[0]):
        pts_ = np.stack([xx_[side], yy_[side]], 1).astype(np.float32)
        if len(pts_) < 40: continue
        mu = pts_.mean(0); _, _, vt = np.linalg.svd(pts_ - mu, full_matrices=False); ax = vt[0]; pr = (pts_ - mu) @ ax; nr = (pts_ - mu) @ np.array([-ax[1], ax[0]])
        e0, e1 = mu + ax * pr.min(), mu + ax * pr.max()
        far, near_ = (e0, e1) if np.linalg.norm(e0 - _bc) > np.linalg.norm(e1 - _bc) else (e1, e0)
        dv = (near_ - far) / np.linalg.norm(near_ - far); wd = int(round(np.percentile(nr, 97) - np.percentile(nr, 3))) + 4
        band = np.zeros((H, W), np.uint8); cv2.line(band, tuple(np.round(far - dv * 2).astype(int)), tuple(np.round(near_ + dv * 14).astype(int)), 1, wd)
        PSRC_M |= band
    PSRC_M &= (1 - (_hairr & (1 - cv2.dilate(_c, np.ones((3, 3), np.uint8)))))      # stop at the bun's hair
    # extrude each pencil 34 px further toward the bun by repeating its last body slice; in the frame this part is shown only over
    # sky, so the pencil always reaches into the (moving) Veo bun and disappears behind its hair
    PSRC_X = _Fr.copy(); PSRC_E = np.zeros((H, W), np.uint8); yy_, xx_ = np.where(PSRC_M > 0)
    for side in (xx_ < _bc[0], xx_ >= _bc[0]):
        pts_ = np.stack([xx_[side], yy_[side]], 1).astype(np.float32)
        if len(pts_) < 40: continue
        mu = pts_.mean(0); _, _, vt = np.linalg.svd(pts_ - mu, full_matrices=False); ax = vt[0]
        if np.dot(_bc - mu, ax) < 0: ax = -ax                                         # ax points toward the bun
        nrm = np.array([-ax[1], ax[0]]); pr = (pts_ - mu) @ ax; nr = (pts_ - mu) @ nrm; L0 = pr.max(); hw = (np.percentile(nr, 98) - np.percentile(nr, 2)) / 2 + 1
        gy, gx = np.mgrid[0:H, 0:W]; rel = np.stack([gx - mu[0], gy - mu[1]], -1)
        prg, nrg = rel @ ax, rel @ nrm
        zone = (prg > L0 - 1) & (prg <= L0 + 34) & (np.abs(nrg - np.median(nr)) <= hw)
        k_ = np.ceil((prg[zone] - (L0 - 9)) / 8.0) * 8.0                                # back into the slice [L0-9, L0-1]
        sx_ = np.clip(np.round(gx[zone] - ax[0] * k_), 0, W - 1).astype(int); sy_ = np.clip(np.round(gy[zone] - ax[1] * k_), 0, H - 1).astype(int)
        PSRC_X[gy[zone], gx[zone]] = _Fr[sy_, sx_]; PSRC_E[zone] = 1
    PSRC_E &= (1 - PSRC_M)
    PSRC = PSRC_X; PSRC_IN = np.linalg.inv(np.vstack([_Mr, [0, 0, 1]]))
    cv2.imwrite(J('engine/out/dev/tmp/psrc_mask.png'), (np.dstack([PSRC_M * 255] * 3) * 0.6 + _Fr * 0.4)[int(_bc[1]) - 110:int(_bc[1]) + 60, int(_bc[0]) - 130:int(_bc[0]) + 130].astype(np.uint8))
EA = {}
for ei, e in enumerate(EYES):
    pts = np.stack([LM[k][e] for k in RNG]); pts = (np.pad(pts, ((1, 1), (0, 0), (0, 0)), mode='edge')[:-2] + 2 * pts + np.pad(pts, ((1, 1), (0, 0), (0, 0)), mode='edge')[2:]) / 4
    for i, k in enumerate(RNG): EA[(k, ei)] = cv2.estimateAffine2D(LS[e].astype(np.float32), pts[i].astype(np.float32), method=cv2.LMEDS)[0]; EA[(k, ei, 'pts')] = pts[i]
od = J('media/act5/frames', outn, '1080'); os.makedirs(od, exist_ok=True)
dbg = opt.get('debug'); os.makedirs(dbg, exist_ok=True) if dbg else None
hsvT = lambda img: cv2.cvtColor(img.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV_FULL).astype(np.float32)
log = []
for i, k in enumerate(RNG):
    F = cv2.imread(files[k]).astype(np.float32); L = LM[k]; O = F.copy()
    if 'nobun' not in opt:
        M = P[i].reshape(2, 3)
        # pencils keep "both caps up" through her head tilts: the bun follows the head (anchor point, scale), but only --rotk of its roll
        sc = np.sqrt(abs(np.linalg.det(M[:, :2]))); th = np.arctan2(M[1, 0], M[0, 0]) * float(opt.get('rotk', 0.35))
        a_s = np.array(BUN[0], float); a_f = M @ np.array([a_s[0], a_s[1], 1.0]) + (BOFF[i] if 'nobunmatch' not in opt else 0)
        R2 = sc * np.array([[np.cos(th), -np.sin(th)], [np.sin(th), np.cos(th)]]); M = np.hstack([R2, (a_f - R2 @ a_s)[:, None]])
        # (1) Veo's pencils out: head-top ROI (around the warped bun), pencil colours, outside the face oval
        hv = hsvT(F); Hh, Ss, Vv = hv[..., 0] * 360 / 255, hv[..., 1] / 255, hv[..., 2] / 255
        cxy = M @ np.array([BUN[0][0], BUN[0][1], 1.0]); s = np.sqrt(abs(np.linalg.det(M[:, :2])))
        roi = np.zeros((H, W), np.uint8); cv2.rectangle(roi, (int(cxy[0] - 150 * s), int(cxy[1] - 90 * s)), (int(cxy[0] + 150 * s), int(L[152][1] - 25)), 1, -1)
        face = np.zeros((H, W), np.uint8); cv2.fillConvexPoly(face, cv2.convexHull(L[OVAL].astype(np.int32)), 1); face = cv2.dilate(face, np.ones((5, 5), np.uint8))
        # a downward pencil end can reach below the chin line beside the face (never over the neck / headphones in between)
        fx0, fx1 = L[OVAL][:, 0].min() + 6, L[OVAL][:, 0].max() - 6
        ext_ = np.zeros((H, W), np.uint8); yb0, yb1 = int(L[152][1] - 25), int(L[152][1] + 12)
        ext_[yb0:yb1, int(fx1):int(cxy[0] + 150 * s)] = 1                              # image-right only (the blue pencil's end; the left side is the headphone cup)
        if np.degrees(np.arctan2(P[i][3], P[i][0])) > 8: roi = np.maximum(roi, ext_)       # only while her head rolls to image-right (the end swings down past the ear then)
        col = (((Hh > 28) & (Hh < 58) & (Ss > 0.5) & (Vv > 0.62)) |                     # yellow body (sky sat < 0.45)
               ((Hh > 12) & (Hh <= 28) & (Ss > 0.55) & (Vv > 0.55)) |                 # orange wood / tip
               (((Hh < 12) | (Hh > 330)) & (Ss > 0.35) & (Vv > 0.55)) |               # pink cap
               ((Hh > 185) & (Hh < 235) & (Ss > 0.35) & (Vv > 0.3)))                  # blue cap
        col = (col & (roi > 0) & (face == 0)).astype(np.uint8)
        col = cv2.morphologyEx(col, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
        _rd = int(opt.get('rmdil', 7 if 'pencilsonly' in opt else 11))
        rm = cv2.dilate(col, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (_rd, _rd)))   # (v13c) 7 = ~3 px around Veo's pencil
        # the sharpened tips (pale wood + graphite) are not pencil-coloured: extend each pencil outward along its own axis
        n_, lab_, st_, _ = cv2.connectedComponentsWithStats(col)
        for j in range(1, n_):
            if st_[j, 4] < 30: continue
            yy, xx = np.where(lab_ == j); pts_ = np.stack([xx, yy], 1).astype(np.float32); mu = pts_.mean(0)
            _, _, vt = np.linalg.svd(pts_ - mu, full_matrices=False); ax = vt[0]; proj = (pts_ - mu) @ ax
            e0, e1 = mu + ax * proj.min(), mu + ax * proj.max()
            far, near_ = (e0, e1) if np.linalg.norm(e0 - cxy) > np.linalg.norm(e1 - cxy) else (e1, e0)
            dvec = (far - near_) / max(1e-3, np.linalg.norm(far - near_))
            ext = 56 if dvec[1] > 0.5 else 32                                            # a downward end reaches past the ear
            cv2.line(rm, tuple(np.round(far).astype(int)), tuple(np.round(far + dvec * ext * s).astype(int)), 1, int(15 * s))
        rm = rm & (1 - face)
        if 'pencilsonly' in opt:
            # (v13c) Veo's pencil outline lines left just outside the tight removal: dark pixels near the pencil that are NOT part of a hair mass
            _lum0 = F.mean(-1); _hk = (_lum0 < 110).astype(np.uint8); _hk[rm > 0] = 0
            _core = cv2.morphologyEx(_hk, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
            _mass = _hk & cv2.dilate(_core, np.ones((5, 5), np.uint8))
            _near = cv2.dilate(rm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
            rm = rm | ((_hk & (1 - _mass) & _near) & (1 - face))
            # faint antialiased outline residue (greyer than the paper) next to the removal, outside the hair masses
            _skyl = np.percentile(_lum0[(roi > 0) & (_lum0 > 150)], 50) if ((roi > 0) & (_lum0 > 150)).any() else 215
            _faint = (((_lum0 < _skyl - 22) | (_lum0 > _skyl + 14)) & (cv2.dilate(_mass, np.ones((7, 7), np.uint8)) == 0)).astype(np.uint8)   # greyer OR whiter than the paper
            rm = rm | (_faint & cv2.dilate(rm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))) & (1 - face))
            rm = cv2.dilate(rm, np.ones((2, 2), np.uint8)) & (1 - face)
        # fill: sky pixels from sky, hair pixels from hair (normalised convolution on each class), whichever surrounds the hole more
        lum_ = O.mean(-1); keep = (rm == 0)
        sky = (keep & (lum_ > 150)).astype(np.float32); hair = (keep & (lum_ < 110)).astype(np.float32)
        sg = 6
        ns, ds = cv2.GaussianBlur(O * sky[..., None], (0, 0), sg), cv2.GaussianBlur(sky, (0, 0), sg)[..., None]
        nh, dh = cv2.GaussianBlur(O * hair[..., None], (0, 0), sg), cv2.GaussianBlur(hair, (0, 0), sg)[..., None]
        tel0 = cv2.inpaint(O.clip(0, 255).astype(np.uint8), rm, 5, cv2.INPAINT_TELEA).astype(np.float32).mean(-1)[..., None]
        if 'pencilsonly' in opt:
            # each hole pixel takes the class (sky / hair) of the NEAREST kept pixel: the bun's edge continues straight through the hole
            dsky = cv2.distanceTransform((sky == 0).astype(np.uint8), cv2.DIST_L2, 5); dhair = cv2.distanceTransform((hair == 0).astype(np.uint8), cv2.DIST_L2, 5)
            hairsil = (((lum_ < 110) & keep) | ((rm > 0) & (dhair < dsky) & ('nearest' in opt))).astype(np.uint8)   # --nearest: off (dark blots at the bun edge)
            hairsil = cv2.morphologyEx(hairsil, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(opt.get("hairclose", 15)),) * 2))
            hairsil = cv2.erode(hairsil, np.ones((int(opt.get("hairerode", 1)),) * 2, np.uint8))
            skyc = (hairsil == 0)[..., None]
            if 'nosdf' not in opt:
                # (v13c) rebuild the hair contour ACROSS each removed pencil: signed distance to the hair edge from the known pixels on
                # both sides, Telea-interpolated through the hole; hair where it is < 0. The outline continues instead of being bitten.
                hk = ((lum_ < 110) & keep).astype(np.uint8); sk = ((lum_ >= 110) & keep).astype(np.uint8)
                hk = hk & cv2.dilate(cv2.morphologyEx(hk, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))), np.ones((5, 5), np.uint8))   # hair masses only
                d2h = cv2.distanceTransform(1 - hk, cv2.DIST_L2, 5); d2s = cv2.distanceTransform(1 - sk, cv2.DIST_L2, 5)
                sdf = np.where(hk > 0, -d2s, d2h); sdf = np.where(rm > 0, 0, sdf)
                enc = np.clip(sdf * 4 + 128, 0, 255).astype(np.uint8)
                sdi = (cv2.inpaint(enc, rm, 9, cv2.INPAINT_TELEA).astype(np.float32) - 128) / 4
                hairs = (sdi < 0) & (rm > 0)
                skyc = (~hairs)[..., None]
        else: skyc = np.where((ds > 1e-3) & (dh > 1e-3), tel0 > 125, ds >= dh)
        fill = np.where(skyc, ns / np.maximum(ds, 1e-4), nh / np.maximum(dh, 1e-4))
        # keep the sky's paper grain: add back the high-pass of a Telea fill
        tel = cv2.inpaint(O.clip(0, 255).astype(np.uint8), rm, 5, cv2.INPAINT_TELEA).astype(np.float32)
        # paper grain in the sky fill: the high-pass of the sky 36 px above (the fill itself is smooth)
        fill = fill + skyc * GRAIN
        O = np.where(rm[..., None] > 0, fill, O)
        if 'pencilsonly' in opt:
            Mrk = (np.vstack([M, [0, 0, 1]]) @ PSRC_IN)[:2].astype(np.float32)          # ref frame -> this frame (via the bun-anchored head)
            Sw = cv2.warpAffine(PSRC_X, Mrk, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
            mb = cv2.warpAffine(PSRC_M.astype(np.float32), Mrk, (W, H), flags=cv2.INTER_LINEAR) > 0.5
            lumO = O.mean(-1)
            me = (cv2.warpAffine(PSRC_E.astype(np.float32), Mrk, (W, H), flags=cv2.INTER_LINEAR) > 0.5) & ~mb
            hairO = cv2.dilate((lumO < 95).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
            # extrusion visible only up to the first hair it meets (connected to the pencil's cut end through sky)
            vis = (me & ~hairO).astype(np.uint8); n_, lab_ = cv2.connectedComponents(vis | mb.astype(np.uint8))
            touch = np.unique(lab_[mb & (lab_ > 0)]); mb = mb | (me & ~hairO & np.isin(lab_, touch))
            a = cv2.GaussianBlur(mb.astype(np.float32), (0, 0), 0.6)
            a = np.where(cv2.erode(mb.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0, 1.0, a)[..., None]   # opaque inside, ~1 px edge
            O = O * (1 - a) + Sw * a
            gS = gV = 1.0
            log.append((k, int(rm.sum()), round(float(gS), 2), round(float(gV), 2)))
    if 'pencilsonly' in opt: pass
    elif 'nobun' not in opt:
        M = P[i].reshape(2, 3); sc = np.sqrt(abs(np.linalg.det(M[:, :2]))); th = np.arctan2(M[1, 0], M[0, 0]) * float(opt.get('rotk', 0.35))
        a_s = np.array(BUN[0], float); a_f = M @ np.array([a_s[0], a_s[1], 1.0]) + (BOFF[i] if 'nobunmatch' not in opt else 0)
        R2 = sc * np.array([[np.cos(th), -np.sin(th)], [np.sin(th), np.cos(th)]]); M = np.hstack([R2, (a_f - R2 @ a_s)[:, None]])
        # (2) the still's bun + pencils in
        Sw = cv2.warpAffine(STILL, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        mw = cv2.warpAffine(pastem, M, (W, H), flags=cv2.INTER_LINEAR)[..., None]
        ring = (cv2.dilate((mw[..., 0] > 0.05).astype(np.uint8), np.ones((9, 9), np.uint8)) - (mw[..., 0] > 0.05)).astype(bool)
        ring &= (cv2.dilate(rm, np.ones((5, 5), np.uint8)) == 0)
        g = (O[ring].mean(0) + 1) / (Sw[ring].mean(0) + 1) if ring.sum() > 50 else np.ones(3)
        g = np.clip(g, 0.85, 1.15)
        O = O * (1 - mw) + (Sw * g) * mw
        log.append((k, int(rm.sum()), np.round(g, 3).tolist()))
    if 'noeyes' not in opt and opt.get('eyemode', 'catch') == 'catch':
        # Veo t2's eyes are sclera-less dark almonds; the gaze is carried only by the white catchlight, and Veo put them on the INNER
        # side of both eyes (= cross-eyed). Move each eye's catchlight to the same place along its own corner-to-corner axis (--catchu,
        # from the image-left corner; 0.62 = a slight glance to image-right, as in the still), keeping its shape and height.
        for ei in range(2):
            if openness(L, ei) < 0.12: continue
            c = EA[(k, ei, 'pts')].mean(0); bx0, by0 = int(c[0] - 26), int(c[1] - 15); bx1, by1 = bx0 + 52, by0 + 30
            Z4 = 4; roi = cv2.resize(O[by0:by1, bx0:bx1], None, fx=Z4, fy=Z4, interpolation=cv2.INTER_CUBIC); hh, ww = roi.shape[:2]
            lr = roi.mean(-1)
            # the drawn eye = the dark almond nearest the FaceMesh eye centre; its filled outline holds the catchlight
            dk = (lr < 90).astype(np.uint8); n, lab, stt, cen = cv2.connectedComponentsWithStats(dk)
            cand = [(np.hypot(cen[j][0] - ww / 2, cen[j][1] - hh / 2), j) for j in range(1, n) if stt[j, 4] > 300]
            if not cand: continue
            comp = (lab == min(cand)[1]).astype(np.uint8)
            # cut away hair strands / liner wings that touch the almond: keep it inside the FaceMesh eye hull (+3 px)
            hl = np.zeros_like(comp); cv2.fillConvexPoly(hl, cv2.convexHull(((EA[(k, ei, 'pts')] - [bx0, by0]) * Z4).astype(np.int32)), 1)
            comp = comp & cv2.dilate(hl, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 17)))
            cs, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); cs = [max(cs, key=cv2.contourArea)] if cs else cs
            fill = np.zeros_like(comp); cv2.drawContours(fill, cs, -1, 1, -1)
            inner = cv2.erode(fill, np.ones((3, 3), np.uint8)) > 0
            cat = inner & (comp == 0) & (lr > 120)
            if cat.sum() < 20: continue
            n2, lab2, st2, _ = cv2.connectedComponentsWithStats(cat.astype(np.uint8)); core = lab2 == 1 + int(np.argmax(st2[1:, 4]))
            xs = np.where(comp)[1]; X0, X1 = xs.min(), xs.max()
            cyy, cxx = np.where(core); cx0 = cxx.mean(); u0 = (cx0 - X0) / max(1, X1 - X0)
            soft = np.clip((lr - 60) / 120.0, 0, 1) * cv2.dilate(cat.astype(np.uint8), np.ones((7, 7), np.uint8))   # all highlights go
            col = roi.copy()
            hole = (cv2.dilate((soft > 0.02).astype(np.uint8), np.ones((5, 5), np.uint8)) & inner.astype(np.uint8))
            val = ((comp > 0) & (hole == 0)).astype(np.float32)
            num = cv2.GaussianBlur(roi * val[..., None], (0, 0), 5); den = cv2.GaussianBlur(val, (0, 0), 5)[..., None]
            hs = cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 1.2)[..., None]
            roi2 = roi * (1 - hs) + (num / np.maximum(den, 1e-4)) * hs
            # new place: the middle of the almond on the catchlight's own rows (robust to liner tails), same height
            ys_c = cyy.mean(); r0, r1 = int(max(0, ys_c - 6)), int(min(hh, ys_c + 7))
            xr = np.where(fill[r0:r1].any(0))[0]; X0m, X1m = xr.min(), xr.max()
            u = float(opt.get('catchu', 0.50)); dx = X0m + u * (X1m - X0m) - cx0
            colm = np.where(fill[:, int(np.clip(round(cx0 + dx), 0, ww - 1))])[0]
            v = float(opt.get('catchv', 0.42)); dy = (colm.min() + v * (colm.max() - colm.min()) - ys_c) if len(colm) else 0.0
            Mt = np.float32([[1, 0, dx], [0, 1, dy]])
            ccol = np.percentile(roi[core], 90, axis=0)                                    # the catchlight's own (bright) colour
            sw = cv2.GaussianBlur(cv2.warpAffine(core.astype(np.float32), Mt, (ww, hh)), (0, 0), 1.1)
            sw = np.clip(sw * 1.6, 0, 1) * cv2.erode(fill, np.ones((5, 5), np.uint8))
            roi2 = roi2 * (1 - sw[..., None]) + ccol * sw[..., None]
            if 'dbgcatch' in opt: print('catch', k, ei, 'u0 %.2f -> %.2f dx %.1f dy %.1f px1080' % ((cx0 - X0m) / max(1, X1m - X0m), u, dx / Z4, dy / Z4))
            wm = cv2.GaussianBlur(cv2.dilate(fill, np.ones((5, 5), np.uint8)).astype(np.float32), (0, 0), 1.0)[..., None]
            roi2 = roi * (1 - wm) + roi2 * wm
            O[by0:by1, bx0:bx1] = cv2.resize(roi2, (52, 30), interpolation=cv2.INTER_AREA)
    if 'noeyes' not in opt and opt.get('eyemode', 'catch') == 'still':
        for ei in range(2):
            wgt = float(np.clip((openness(L, ei) - float(opt.get('eye0', 0.10))) / 0.07, 0, 1))   # FaceMesh lid gap / eye width
            if wgt <= 0: continue
            A = EA[(k, ei)]
            Sw = cv2.warpAffine(STILL, A, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
            fh = np.zeros((H, W), np.uint8); cv2.fillConvexPoly(fh, cv2.convexHull(L[EYES[ei]].astype(np.int32)), 1)
            fh = cv2.dilate(fh, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 11)))
            mw = np.maximum(cv2.warpAffine(eyem[ei].astype(np.float32), A, (W, H), flags=cv2.INTER_LINEAR), fh.astype(np.float32))
            ring = (cv2.dilate((mw > 0.5).astype(np.uint8), np.ones((7, 7), np.uint8)) - (mw > 0.5)).astype(bool)
            g = np.clip((O[ring].mean(0) + 1) / (Sw[ring].mean(0) + 1), 0.85, 1.15) if ring.sum() > 30 else np.ones(3)
            mw = (cv2.GaussianBlur(mw, (0, 0), 1.8) * wgt)[..., None]
            O = O * (1 - mw) + (Sw * g) * mw
    cv2.imwrite(os.path.join(od, f'f_{k:05d}.jpg'), O.clip(0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
    if dbg and (k % 8 == 0) and 'nobun' not in opt:
        vis = F.copy(); vis[rm > 0] = vis[rm > 0] * 0.5 + np.array([0, 0, 255]) * 0.5
        cv2.imwrite(os.path.join(dbg, f'rm_{k:03d}.png'), np.hstack([F[150:450, 850:1250], vis[150:450, 850:1250], O[150:450, 850:1250]]).clip(0, 255).astype(np.uint8))
    if dbg and (k % 8 == 0):
        x0, y0 = int(L[10][0] - 200), int(L[10][1] - 120)
        cv2.imwrite(os.path.join(dbg, f'eb_{k:03d}.png'), np.hstack([F[y0:y0 + 400, x0:x0 + 400], O[y0:y0 + 400, x0:x0 + 400]]).clip(0, 255).astype(np.uint8))
json.dump({'n': len(RNG), 'fps': 30, 'src': f'{src} frames {RNG[0]}-{RNG[-1]} + still eyes / bun / pencils (pb_spread_eyesbun.py)'}, open(os.path.join(od, 'index.json'), 'w'))
print('still eye openness', np.round(OS, 3)); print('pencil px removed / gain (sample):', log[::16])
print('wrote', od)
