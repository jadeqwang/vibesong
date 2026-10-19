"""v4 Pass B paper, Task C: the APPROVED v11 brows (exactly the pixels of the v11 spread still) onto the outro's living
right-page layer (Veo FrameSeq spreadR, 223 frames @ 30), frame by frame. No gen: the brows are the still's own (model-drawn,
composited in Pass A), so the layer hands off into the still (194.06 -> 194.9 fade) with the same brows.
    $OSPY tools/cutscenes/pb_spread_browtrack.py [OUT_NAME=spreadR_v11] [--debug=DIR]
    lid fix (live on frames 0-20,87-102,105-110,159-170): ... spreadR_v11 --frames=0-20,87-102,105-110,159-170 --lidguard=14
    (--frames rewrites only those frames and leaves index.json alone; --measure prints old-vs-lidguard diffs + eye openness)
Per frame: (1) Veo's own brows are removed: dark pixels inside the dilated FaceMesh brow hull (minus hair / lash / lid lines
outside the hull, --prot px around them) are inpainted (Telea; --fill=skin = skin-only normalised convolution, rejected: it cut
the hair strands that touch the brow tails); (2) the still's brows are carried as a RATIO image (still / still-with-brows-inpainted, inside the Pass A brow
mask assets/sheets/v11/raw/mask_spread.png), warped by a per-brow affine (still brow landmarks -> frame brow landmarks,
temporally smoothed) and multiplied onto the cleaned frame, so the brow ink takes on each frame's own skin tone and light.
Work is done on a 2x face crop; only a feathered brow region is pasted back. Everything else in the frame is untouched
(apart from the JPEG re-encode). Writes media/act5/frames/OUT_NAME/{1080,540}/ + index.json (conform.py layout)."""
import sys, os, json, glob, numpy as np, cv2, mediapipe as mp
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
J = lambda *p: os.path.join(ROOT, *p)
args = [a for a in sys.argv[1:] if not a.startswith('--')]; opt = dict((a[2:].split('=') + [''])[:2] for a in sys.argv[1:] if a.startswith('--'))
OUT = args[0] if args else 'spreadR_v11'
SRC = J('media/act5/frames', opt.get('src', 'spreadR'), '1080')            # --src=spreadR_v12_raw for a new take
STILL, MASK = J('media/act5/tex/spread_full_v11.jpg'), J('assets/sheets/v11/raw/mask_spread.png')
RX, RY, RW, RH = 0.444 * 5504, 0.235 * 3072, 0.556 * 5504, 0.5602 * 3072     # spread.js spreadR rect (image px of the 5504x3072 still)
C = tuple(int(v) for v in opt.get('crop', '860,180,1180,500').split(',')); K = 2   # --crop: face crop (1080 px), must hold the head all clip                                           # face crop in 1080 frame px, work scale
CW, CH = (C[2] - C[0]) * K, (C[3] - C[1]) * K
BROWS = [[70, 63, 105, 66, 107, 46, 53, 52, 65, 55], [300, 293, 334, 296, 336, 276, 283, 282, 295, 285]]
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3)
fm_still = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3)
lum = lambda a: a[..., 0] * .114 + a[..., 1] * .587 + a[..., 2] * .299   # BGR


def landmarks(det, crop_bgr, k):
    """FaceMesh on a crop (already in work px), upscaled by k for the detector -> work px"""
    big = cv2.resize(crop_bgr, None, fx=k, fy=k, interpolation=cv2.INTER_CUBIC)
    r = det.process(cv2.cvtColor(big, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks: return None
    return np.array([[p.x * big.shape[1] / k, p.y * big.shape[0] / k] for p in r.multi_face_landmarks[0].landmark])


# ---- the still in work space (frame px (x,y) -> still px)
sx, sy = RW / 1920, RH / 1080
M_fs = np.array([[sx / K, 0, RX + C[0] * sx], [0, sy / K, RY + C[1] * sy]], np.float32)   # work -> still px
still_full = cv2.imread(STILL); mask_full = cv2.imread(MASK, cv2.IMREAD_GRAYSCALE)
Sw = cv2.warpAffine(still_full, M_fs, (CW, CH), flags=cv2.INTER_AREA | cv2.WARP_INVERSE_MAP).astype(np.float32)
Mw = cv2.warpAffine(mask_full, M_fs, (CW, CH), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP).astype(np.float32) / 255
LS = landmarks(fm_still, Sw.clip(0, 255).astype(np.uint8), 2)
assert LS is not None, 'no face on the still'
# ratio image of the still's brows (per brow, split at the midpoint between the two brows)
mb = (Mw > 0.02).astype(np.uint8)
Sclean = cv2.inpaint(Sw.clip(0, 255).astype(np.uint8), cv2.dilate(mb, np.ones((5, 5), np.uint8)), 5, cv2.INPAINT_TELEA).astype(np.float32)
Sclean = cv2.GaussianBlur(Sclean, (0, 0), 1.0)
ratio = np.clip((Sw + 1) / (Sclean + 1), 0, 1.03)
am = cv2.GaussianBlur(np.clip(Mw * 1.15, 0, 1), (0, 0), 0.8)[..., None]
Rs = 1 + (ratio - 1) * am                                                   # 1 outside the brows
midx = (LS[BROWS[0]][:, 0].mean() + LS[BROWS[1]][:, 0].mean()) / 2
xx = np.arange(CW)[None, :].repeat(CH, 0)
side = [(xx < midx), (xx >= midx)]                                         # FaceMesh brow 0 = subject's right = image-left
Rb = [np.where(side[b][..., None], Rs, 1.0).astype(np.float32) for b in range(2)]
Ab = [np.where(side[b], am[..., 0], 0).astype(np.float32) for b in range(2)]
# (fix 2026-10-18, coordinator) the Pass A brow mask's lower edge touches the still's upper lash line / lid crease, so the ratio
# image carried a sliver of the still's lash line. Over Veo's open eyes it merged with her own lids; over closed lids it showed as a
# brownish arc. --lidguard=MG cuts the brow alpha below the still's upper-lid contour raised by MG work px (feathered).
UPPER = [[246, 161, 160, 159, 158, 157, 173], [466, 388, 387, 386, 385, 384, 398]]
def guarded(mg):
    g = np.zeros((CH, CW), np.uint8)
    for u in UPPER:
        c = LS[u].copy(); c[:, 1] -= mg; c = c[np.argsort(c[:, 0])]
        c[0, 0] -= 24; c[-1, 0] += 24                                            # a little past the eye corners
        poly = np.vstack([c, [[c[-1, 0], CH], [c[0, 0], CH]]]).astype(np.int32); cv2.fillPoly(g, [poly], 1)
    # drop whole ink components of the ratio image that sit mostly in the lid zone (the lash-line sliver); brow strokes are kept whole
    ink = ((lum(ratio) < 0.88) & (Mw > 0.02)).astype(np.uint8)
    n, lab = cv2.connectedComponents(ink, connectivity=8)
    drop = np.zeros((CH, CW), np.uint8)
    for i in range(1, n):
        cm = lab == i
        if (g[cm] > 0).mean() > 0.5:
            drop[cm] = 1; yy, xx = np.where(cm); print('  lidguard drops component', i, 'px', int(cm.sum()), 'bbox', xx.min(), yy.min(), xx.max(), yy.max())
    drop = cv2.dilate(drop, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    # darken-only, and only on the brow ink itself: gate = the kept ink components (ratio darkness >= ~0.3 of a brow stroke), grown 1 px
    rr = np.minimum(ratio, 1.0); dk = 1 - lum(rr)
    # strongly chromatic ratio pixels (the still's warm hair edge at the image-left tail) go neutral, so no orange fleck lands on skin
    chroma = np.abs(rr[..., 2] - rr[..., 0])[..., None]
    rr = np.where(chroma > float(opt.get('chroma', 0.12)), lum(rr)[..., None].repeat(3, -1), rr)
    gate = ((dk > float(opt.get('gate', 0.12))) & (Mw > 0.02) & (drop == 0)).astype(np.uint8)
    # and nothing more than --browlow work px below each brow's lower landmark contour (the still's lid crease joins the image-left brow tail)
    low = np.zeros((CH, CW), np.uint8); yy = np.arange(CH)[:, None]
    for lo in ([46, 53, 52, 65, 55], [276, 283, 282, 295, 285]):
        c = LS[lo]; c = c[np.argsort(c[:, 0])]; xs = np.arange(CW)
        yl = np.interp(xs, c[:, 0], c[:, 1]) + float(opt.get('browlow', 5))
        inx = (xs >= c[0, 0] - 30) & (xs <= c[-1, 0] + 30)
        low |= ((yy > yl[None, :]) & inx[None, :]).astype(np.uint8)
    gate &= (1 - low)
    gate = cv2.GaussianBlur(cv2.dilate(gate, np.ones((3, 3), np.uint8)).astype(np.float32), (0, 0), 0.8)
    amg = am[..., 0] * gate; Rsg = 1 + (rr - 1) * amg[..., None]
    print('lidguard: ink components', n - 1, 'dropped px', int(drop.sum()))
    return ([np.where(side[b][..., None], Rsg, 1.0).astype(np.float32) for b in range(2)],
            [np.where(side[b], amg, 0).astype(np.float32) for b in range(2)], np.maximum(g, drop))
VAR = {'base': (Rb, Ab)}; dbg_on = bool(opt.get('debug'))
if opt.get('lidguard'):
    _r, _a, GUARD = guarded(float(opt['lidguard'])); VAR['guard'] = (_r, _a)
    os.makedirs(J('engine/out/dev/tmp/spfix'), exist_ok=True) if dbg_on else None
    if dbg_on: cv2.imwrite(J('engine/out/dev/tmp/spfix/still_guard.png'), np.hstack([Sw, Sw * (1 - 0.5 * GUARD[..., None]) + np.array([0, 0, 255]) * 0.5 * GUARD[..., None],
                Sw * (1 - 0.5 * _a[0][..., None] - 0.5 * _a[1][..., None]) + np.array([0, 255, 0]) * 0.5 * (_a[0] + _a[1])[..., None]]).clip(0, 255).astype(np.uint8))

# ---- frames
files = sorted(glob.glob(os.path.join(SRC, 'f_*.jpg'))); N = len(files)
LM = []
for f in files:
    fr = cv2.imread(f)[C[1]:C[3], C[0]:C[2]]
    LM.append(landmarks(fm, cv2.resize(fr, None, fx=K, fy=K, interpolation=cv2.INTER_CUBIC), 2))
miss = [i for i, l in enumerate(LM) if l is None]; print('faces', N - len(miss), '/', N, 'missing', miss)
ok = [i for i in range(N) if LM[i] is not None]
A = np.stack([LM[i] if LM[i] is not None else LM[min(ok, key=lambda j: abs(j - i))] for i in range(N)])   # N x 478 x 2
# temporal smoothing of the brow points (5-tap, edge-padded)
idx = sorted(set(sum(BROWS, [])))
ker = np.array([1, 2, 3, 2, 1], float); ker /= ker.sum()
As = A.copy()
for j in idx:
    for c in range(2): As[:, j, c] = np.convolve(np.pad(A[:, j, c], 2, mode='edge'), ker, 'valid')
dbg = opt.get('debug'); os.makedirs(dbg, exist_ok=True) if dbg else None
od = {h: J('media/act5/frames', OUT, str(h)) for h in (1080, 540)}
for d in od.values(): os.makedirs(d, exist_ok=True)
stats = []
def _rng(x):
    out = set()
    for part in x.split(','):
        a, _, b = part.partition('-'); out |= set(range(int(a), int(b or a) + 1))
    return out
ONLY = _rng(opt['frames']) if opt.get('frames') else None      # --frames=5-15,105-110: rewrite only these (others stay byte-identical)
def render(k, f, Rb, Ab):
    full = cv2.imread(f); fr = full[C[1]:C[3], C[0]:C[2]]
    F = cv2.resize(fr, None, fx=K, fy=K, interpolation=cv2.INTER_CUBIC).astype(np.float32)
    L = As[k]
    # (1) remove Veo's brows
    rm = np.zeros((CH, CW), np.uint8); skins = []
    for b in BROWS:
        hull = np.zeros((CH, CW), np.uint8); cv2.fillConvexPoly(hull, cv2.convexHull(L[b].astype(np.int32)), 1)
        hull = cv2.dilate(hull, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 11)))
        ys, xs = np.where(hull > 0); y0, y1, x0, x1 = max(0, ys.min() - 12), min(CH, ys.max() + 12), max(0, xs.min() - 12), min(CW, xs.max() + 12)
        g = lum(F); skin = np.percentile(g[y0:y1, x0:x1], 80)
        dark = ((g < skin - float(opt.get("thr", 30))) & (hull > 0)).astype(np.uint8)
        # protect hair / lash / lid lines: dark pixels OUTSIDE the brow hull (and a few px around them) are never removed
        near = np.zeros((CH, CW), np.uint8); near[y0:y1, x0:x1] = 1
        protect = cv2.dilate(((g < skin - float(opt.get("thr", 30))) & (hull == 0) & (near > 0)).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (max(1, int(opt.get('prot', 7))),) * 2))
        rm |= cv2.dilate(dark, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))) & ((1 - protect) if int(opt.get('prot', 7)) else 1); skins.append(skin)
    if opt.get('fill', 'telea') == 'telea':
        Fc = cv2.inpaint(F.clip(0, 255).astype(np.uint8), rm, 5, cv2.INPAINT_TELEA).astype(np.float32)
    else:   # skin-only normalised convolution: hair / lash / lid lines next to the brow never bleed into the fill
        valid = ((rm == 0) & (g > min(skins) - 25)).astype(np.float32)
        num = cv2.GaussianBlur(F * valid[..., None], (0, 0), 7); den = cv2.GaussianBlur(valid, (0, 0), 7)[..., None]
        Fc = np.where(rm[..., None] > 0, num / np.maximum(den, 1e-3), F)
    # (2) the still's brows, warped per brow, multiplied on
    O = Fc.copy(); W8 = cv2.GaussianBlur(rm.astype(np.float32), (0, 0), 1.5); global DBG_R; DBG_R = np.ones_like(Fc)
    for bi, b in enumerate(BROWS):
        M, _ = cv2.estimateAffinePartial2D(LS[b].astype(np.float32), L[b].astype(np.float32), method=cv2.LMEDS)
        Rw = cv2.warpAffine(Rb[bi], M, (CW, CH), flags=cv2.INTER_CUBIC, borderValue=(1, 1, 1))
        O *= np.clip(Rw, 0, 1.03); DBG_R *= np.clip(Rw, 0, 1.03)
        W8 = np.maximum(W8, cv2.GaussianBlur(cv2.warpAffine(Ab[bi], M, (CW, CH), flags=cv2.INTER_LINEAR), (0, 0), 2.0))
    # paste back only the touched region (feathered), at 1x
    w = np.clip(cv2.dilate(W8, np.ones((7, 7), np.uint8)) * 3, 0, 1)
    w = cv2.GaussianBlur(w, (0, 0), 2.0)[..., None]
    out2 = F * (1 - w) + O * w
    small = cv2.resize(out2, (C[2] - C[0], C[3] - C[1]), interpolation=cv2.INTER_AREA)
    ws = cv2.resize(w[..., 0], (C[2] - C[0], C[3] - C[1]), interpolation=cv2.INTER_AREA)[..., None]
    reg = fr.astype(np.float32) * (1 - ws) + small * ws
    full[C[1]:C[3], C[0]:C[2]] = reg.clip(0, 255).astype(np.uint8)
    return full, F, Fc, out2

def eye_open(k):
    l = A[k]; r = []
    for up, lo, c0, c1 in ((159, 145, 33, 133), (386, 374, 362, 263)):
        r.append(np.linalg.norm(l[up] - l[lo]) / np.linalg.norm(l[c0] - l[c1]))
    return r

use = 'guard' if opt.get('lidguard') and 'measure' not in opt else 'base'
for k, f in enumerate(files):
    if ONLY is not None and k not in ONLY: continue
    if 'measure' in opt:   # old recipe vs lid-guarded, at 1x in the crop: how much the guard changes this frame
        a0 = render(k, f, *VAR['base'])[0][C[1]:C[3], C[0]:C[2]].astype(int); a1 = render(k, f, *VAR['guard'])[0][C[1]:C[3], C[0]:C[2]].astype(int)
        d = np.abs(a0 - a1).max(-1); eo = eye_open(k)
        print(f'MEASURE {k:3d} open {eo[0]:.3f} {eo[1]:.3f} maxdiff {d.max():3d} px>8 {(d > 8).sum():4d} px>16 {(d > 16).sum():4d}'); continue
    full, F, Fc, out2 = render(k, f, *VAR[use])
    cv2.imwrite(os.path.join(od[1080], os.path.basename(f)), full, [cv2.IMWRITE_JPEG_QUALITY, 95])
    cv2.imwrite(os.path.join(od[540], os.path.basename(f)), cv2.resize(full, (960, 540), interpolation=cv2.INTER_LANCZOS4), [cv2.IMWRITE_JPEG_QUALITY, 92])
    if dbg and (k % 10 == 0 or ONLY is not None):
        cv2.imwrite(os.path.join(dbg, f'dbg_{k:03d}.png'), np.hstack([F, Fc, out2, DBG_R * 200]).clip(0, 255).astype(np.uint8))
if 'measure' in opt: sys.exit(0)
src_idx = json.load(open(os.path.join(SRC, 'index.json')))
for h in ((1080, 540) if ONLY is None else ()):
    json.dump({'n': N, 'fps': src_idx.get('fps', 30), 'src': src_idx.get('src', '') + ' + v11 brows (pb_spread_browtrack.py)'}, open(os.path.join(od[h], 'index.json'), 'w'))
print('wrote', od)
