"""v4.7 v47_outro (Jade on 3:08: "the arm patch is gibberish, and the shoulder epaulette detail is wrong, and the bottom of the jacket and
cuffs shouldn't be orange (see character sheet)"). Fix ONLY Jade's jacket on the outro spread frames, every other pixel kept:
  (c) hem band, cuffs, shoulder strips and pocket slashes: orange -> jacket white (Lab: chroma -> the frame's own jacket white, L scaled
      by white/orange so the pencil shading + grain stay); the chest band and one band per upper arm stay orange.
  (b) snap epaulettes (inputs/jacket-base.png, assets/sheets/v11/paper_jade_turnaround_v11.png): a pencil-drawn strap along each
      shoulder top + a snap near the collar end, drawn in keyframe space, carried per frame by a local affine.
  (a) the rectangular gibberish label on her LEFT upper arm (image-right) -> erased, and a round b/w 1420 MHz patch (inputs/
      sleeve_patch_1420MHz.png) centred ON the orange arm band, carried by the arm's local affine.
Tracking: DIS optical flow frame k <-> keyframe K (direct, not chained; crop window WIN) -> class map warped for (c); RANSAC affines
from the flow on small regions for (a)/(b), Gaussian-smoothed over time (sigma 1 frame).
    $OSPY tools/cutscenes/pb_spread47_jacket.py SRC_SET OUT_SET [--frames=a-b] [--debug=DIR] [--no-patch] [--no-epa]
SRC_SET/OUT_SET = media/act5/frames/<name>; writes OUT_SET/{1080,540}/f_%05d.jpg (+ index.json copied)."""
import sys, os, json, shutil, numpy as np, cv2

R = "/home/jade/Documents/vibesong/"
src, dst = sys.argv[1], sys.argv[2]
opt = dict((a[2:].split('=', 1) + [''])[:2] for a in sys.argv[3:] if a.startswith('--'))
SD, OD = f"{R}media/act5/frames/{src}/1080/", f"{R}media/act5/frames/{dst}/"
N = len([f for f in os.listdir(SD) if f.startswith('f_')])
fr = range(N) if 'frames' not in opt else range(int(opt['frames'].split('-')[0]), int(opt['frames'].split('-')[1]) + 1)
K = 20                                         # keyframe (all geometry below is in keyframe-20 pixels, 1920x1080)
X0, Y0, X1, Y1 = 760, 330, 1340, 900           # work window
WW, WH = X1 - X0, Y1 - Y0
dbg = opt.get('debug')
if dbg: os.makedirs(dbg, exist_ok=True)

def rd(k): return cv2.imread(f"{SD}f_{k:05d}.jpg")

def orange_w(im):
    """soft 'jacket orange' weight (bench/strap/rim orange too: classes decide). The saturation threshold rises with brightness so
    bright skin (s ~110-165, same hue) never counts, while dark orange/outline mix pixels (low v) still do."""
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(np.float32)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    wh = np.clip(1 - np.maximum(0, np.abs(h - 9.5) - 7.0) / 3.0, 0, 1)
    th = 130 + 40 * np.clip((v - 130) / 60, 0, 1)
    return wh * np.clip((s - th) / 35, 0, 1) * np.clip((v - 40) / 30, 0, 1)

# ---- (c) class map on the keyframe: RECOLOR boxes (frame px) intersected with the strict orange mask
RECOLOR = {  # name: (x0, y0, x1, y1)
    'shoulderL': (880, 398, 952, 442), 'shoulderR': (1062, 384, 1142, 440),
    'pocketL': (898, 552, 932, 602), 'pocketR': (1060, 558, 1104, 606),
    'hemL': (902, 598, 958, 660), 'hemR': (1026, 596, 1122, 662),
    'cuffL': (770, 712, 884, 790), 'cuffR': (1168, 730, 1232, 788),
}
fk = rd(K)
wk = orange_w(fk[Y0:Y1, X0:X1])
cls = np.zeros((WH, WW), np.uint8)
for i, (x0, y0, x1, y1) in enumerate(RECOLOR.values()):
    # per box: the largest connected piece of the strict mask (after a 3x3 open that drops the 1-2 px silhouette rim), regrown
    # inside the raw mask -> never a strap end / rim / bench pixel that happens to sit in the box
    sub = (wk[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] > 0.5).astype(np.uint8)
    op = cv2.morphologyEx(sub, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(op, 8)
    if n < 2: continue
    big = (lab == 1 + int(np.argmax(st[1:, 4]))).astype(np.uint8)
    big = cv2.dilate(big, np.ones((5, 5), np.uint8)) & sub
    cls[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0][big > 0] = i + 1
clsD = cv2.dilate(cls, np.ones((7, 7), np.uint8))   # labels, tolerance for flow error (grey dilation: regions are far apart)
if dbg: cv2.imwrite(f"{dbg}/cls_K.png", cv2.addWeighted(fk[Y0:Y1, X0:X1], 0.5, cv2.merge([(clsD > 0).astype(np.uint8) * 255, cls * 30, cls * 0]), 0.5, 0))

dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
dis.setFinestScale(0)
gk = cv2.cvtColor(fk[Y0:Y1, X0:X1], cv2.COLOR_BGR2GRAY)
gx, gy = np.meshgrid(np.arange(WW, dtype=np.float32), np.arange(WH, dtype=np.float32))

def recolor(im, lab_reg, w):
    """im: window crop; lab_reg: warped dilated RECOLOR labels; w: soft orange weight. Per region: chroma -> the nearby jacket white,
    L scaled by (nearby white L / the region's orange L) so the shading + grain stay. Returns new crop, alpha."""
    lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    whiteish = (hsv[..., 1] < 45) & (hsv[..., 2] > 170) & (lab_reg == 0)
    out = lab.copy(); A = np.zeros(w.shape, np.float32)
    # the red-brown pencil outlines (dark, v < ~120) are never touched; border pixels get their chroma moved fully (2w) so no orange fringe
    vv = hsv[..., 2].astype(np.float32); gate = np.clip((vv - 115) / 40, 0, 1)
    wc_all = np.clip(2 * w, 0, 1) * gate; w = w * gate
    for i in range(1, len(RECOLOR) + 1):
        reg = lab_reg == i
        if reg.sum() < 20: continue
        a = w * reg
        ys, xs = np.where(reg); y0, y1, x0, x1 = max(0, ys.min() - 30), ys.max() + 31, max(0, xs.min() - 30), xs.max() + 31
        wsel = whiteish[y0:y1, x0:x1]
        wr = np.median(lab[y0:y1, x0:x1][wsel], axis=0) if wsel.sum() > 30 else np.array([205, 130, 134], np.float32)
        osel = a > 0.9
        orr = np.median(lab[osel], axis=0) if osel.sum() > 15 else np.array([150, 178, 190], np.float32)
        new = lab.copy()
        new[..., 0] = np.clip(wr[0] + (lab[..., 0] - orr[0]) * 0.85, 0, 248)   # additive: keeps the grain's contrast
        new[..., 1] = wr[1] + (lab[..., 1] - orr[1]) * 0.05
        new[..., 2] = wr[2] + (lab[..., 2] - orr[2]) * 0.05
        aa = (wc_all * reg)[..., None]; la = (a * a)[..., None]
        out[..., :1] = out[..., :1] * (1 - la) + new[..., :1] * la
        out[..., 1:] = out[..., 1:] * (1 - aa) + new[..., 1:] * aa
        A = np.maximum(A, a)
    return cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR), A

# ---- tracking for (a) and (b): ECC (euclidean) of the keyframe's window onto frame k, one mask per part, init = previous frame
ARM = np.array([(1104, 486), (1161, 486), (1176, 580), (1113, 580)], np.int32)          # her left upper arm around the band (K px)
SHL, SHR = (880, 402, 946, 476), (1060, 394, 1140, 476)                                  # shoulders (strip + jacket below, K px), cups excluded
def part_mask(kind):
    m = np.zeros((WH, WW), np.uint8)
    if kind == 'arm': cv2.fillPoly(m, [ARM - [X0, Y0]], 1)
    else:
        x0, y0, x1, y1 = kind; m[y0 - Y0 - 6:y1 - Y0 + 6, x0 - X0 - 6:x1 - X0 + 6] = 1
        m &= (gk > 120).astype(np.uint8)                       # jacket / sky only, never the dark cups
    return m
def track_all(parts):
    """per frame: DIS flow k->K on the window, then a RANSAC similarity K->k fitted to the flow vectors that land inside each part's
    keyframe mask (Jade's moving cups/hair outside the masks are rejected as outliers); Gaussian-smoothed over time (sigma 1)."""
    masks = {n: part_mask(kd) for n, kd in parts.items()}
    sy, sx = np.mgrid[0:WH:2, 0:WW:2]; sx = sx.ravel().astype(np.float32); sy = sy.ravel().astype(np.float32)
    raw = {n: [] for n in parts}
    for k in range(N):
        g = cv2.cvtColor(rd(k)[Y0:Y1, X0:X1], cv2.COLOR_BGR2GRAY)
        flo = np.zeros((WH, WW, 2), np.float32) if k == K else dis.calc(g, gk, None)
        kx = sx + flo[sy.astype(int), sx.astype(int), 0]; ky = sy + flo[sy.astype(int), sx.astype(int), 1]
        ok = (kx >= 0) & (kx < WW - 1) & (ky >= 0) & (ky < WH - 1)
        for n, m in masks.items():
            sel = ok.copy(); sel[ok] = m[ky[ok].astype(int), kx[ok].astype(int)] > 0
            A, inl = cv2.estimateAffinePartial2D(np.stack([kx[sel], ky[sel]], 1), np.stack([sx[sel], sy[sel]], 1), method=cv2.RANSAC, ransacReprojThreshold=1.5, maxIters=3000, confidence=0.999)
            if A is None: A = raw[n][-1] if raw[n] else np.eye(2, 3, dtype=np.float32)
            raw[n].append(A.astype(np.float32))
    out = {}
    for n in parts:
        # parametrise about the part's centre so rotation and translation are decoupled before smoothing
        ys, xs = np.where(masks[n]); cx, cy = xs.mean(), ys.mean()
        P = []
        for A in raw[n]:
            sc = np.hypot(A[0, 0], A[1, 0]); an = np.arctan2(A[1, 0], A[0, 0])
            P.append([an, sc, A[0, 0] * cx + A[0, 1] * cy + A[0, 2], A[1, 0] * cx + A[1, 1] * cy + A[1, 2]])
        P = np.array(P)
        if n != 'arm': P[:, 1] = 1.0                       # shoulders: rigid (scale is noise on such small masks)
        from scipy.ndimage import median_filter
        Pm = np.stack([median_filter(P[:, i], size=5, mode='nearest') for i in range(4)], 1)   # drop one-frame RANSAC flips
        Ps = np.stack([cv2.GaussianBlur(Pm[:, i].reshape(-1, 1), (1, 0), 1.2).ravel() for i in range(4)], 1)
        Ws = []
        for an, sc, mx, my in Ps:
            c, s_ = sc * np.cos(an), sc * np.sin(an)
            Ws.append(np.float32([[c, -s_, mx - (c * cx - s_ * cy)], [s_, c, my - (s_ * cx + c * cy)]]))
        out[n] = (Ws, P)
    return out
TPL = (1128, 508, 1176, 562)                                   # the label + a 4-5 px margin of band / outline (K px)
def track_label():
    """the drawn label drifts on the arm (the video model re-draws it), so the patch follows the LABEL, not the arm: per frame a
    gray template match of the keyframe label over x-scales 0.80-1.07 (the arm turning foreshortens it); median 7 + Gaussian 1.5
    (scale: Gaussian 4). Returns per-frame (mx, my, sx): K px (x, y) -> (mx + sx (x - TPL0), my + (y - TPL1))."""
    T = cv2.cvtColor(fk, cv2.COLOR_BGR2GRAY).astype(np.float32)[TPL[1]:TPL[3], TPL[0]:TPL[2]]
    out = []
    for k in range(N):
        g = cv2.cvtColor(rd(k), cv2.COLOR_BGR2GRAY).astype(np.float32)[440:640, 1060:1240]
        best = (-1, 0, 0, 1)
        for sx in np.arange(0.80, 1.08, 0.01):
            t = cv2.resize(T, (int(round(T.shape[1] * sx)), T.shape[0]), interpolation=cv2.INTER_AREA)
            r = cv2.matchTemplate(g, t, cv2.TM_CCOEFF_NORMED); _, mv, _, ml = cv2.minMaxLoc(r)
            if mv > best[0]:
                # sub-pixel peak
                x, y = ml; dx = dy = 0.0
                if 0 < x < r.shape[1] - 1: a, b, c = r[y, x - 1], r[y, x], r[y, x + 1]; dx = 0.5 * (a - c) / (a - 2 * b + c + 1e-9)
                if 0 < y < r.shape[0] - 1: a, b, c = r[y - 1, x], r[y, x], r[y + 1, x]; dy = 0.5 * (a - c) / (a - 2 * b + c + 1e-9)
                best = (mv, x + dx + 1060, y + dy + 440, t.shape[1] / T.shape[1])
        out.append(best)
    P = np.array(out)
    from scipy.ndimage import median_filter
    Q = np.stack([median_filter(P[:, i], size=7, mode='nearest') for i in (1, 2, 3)], 1)
    Q[:, 0] = cv2.GaussianBlur(Q[:, 0].reshape(-1, 1), (1, 0), 1.5).ravel(); Q[:, 1] = cv2.GaussianBlur(Q[:, 1].reshape(-1, 1), (1, 0), 1.5).ravel()
    Q[:, 2] = cv2.GaussianBlur(Q[:, 2].reshape(-1, 1), (1, 0), 4.0).ravel()
    return Q, P
def label_aff(q, ang):
    """K px -> frame px for the label/patch: x-scale sx about the template origin, translate, then the arm's (smoothed) rotation about the label centre"""
    mx, my, sx = q
    A = np.float64([[sx, 0, mx - sx * TPL[0]], [0, 1, my - TPL[1]], [0, 0, 1]])
    cx, cy = mx + sx * (PC[0] - TPL[0]), my + (PC[1] - TPL[1])
    c, s_ = np.cos(ang), np.sin(ang)
    Rm = np.float64([[c, -s_, cx - c * cx + s_ * cy], [s_, c, cy - s_ * cx - c * cy], [0, 0, 1]])
    return (Rm @ A)[:2].astype(np.float32)
def tf_pt(A, x, y): return A[0, 0] * x + A[0, 1] * y + A[0, 2], A[1, 0] * x + A[1, 1] * y + A[1, 2]
def tf(W, x, y):   # K frame px -> frame k px (W maps window coords)
    return W[0, 0] * (x - X0) + W[0, 1] * (y - Y0) + W[0, 2] + X0, W[1, 0] * (x - X0) + W[1, 1] * (y - Y0) + W[1, 2] + Y0
def full_aff(W):   # 2x3 in full-frame px
    T = np.float64([[1, 0, X0], [0, 1, Y0], [0, 0, 1]]) @ np.vstack([W, [0, 0, 1]]) @ np.float64([[1, 0, -X0], [0, 1, -Y0], [0, 0, 1]])
    return T[:2].astype(np.float32)
do_patch, do_epa = 'no-patch' not in opt, 'no-epa' not in opt
if do_patch or do_epa:
    TC = f"{R}media/act5/_work/v47/tracks_{src}.npz"; os.makedirs(os.path.dirname(TC), exist_ok=True)
    if os.path.exists(TC) and 'retrack' not in opt:
        z = np.load(TC); trk = {n: (list(z[n + '_W']), z[n + '_P']) for n in ('arm', 'shL', 'shR')}; LQ, LP = z['lbl_Q'], z['lbl_P']
    else:
        trk = track_all({'arm': 'arm', 'shL': SHL, 'shR': SHR}); LQ, LP = track_label()
        np.savez(TC, lbl_Q=LQ, lbl_P=LP, **{n + '_W': np.array(v[0]) for n, v in trk.items()}, **{n + '_P': v[1] for n, v in trk.items()})
    if dbg: json.dump({'Q': LQ.tolist(), 'P': LP.tolist()}, open(f"{dbg}/label_track.json", "w"))
    ARMANG = np.array([trk['arm'][1][k][0] for k in range(N)]); ARMANG = cv2.GaussianBlur((ARMANG - ARMANG[K]).reshape(-1, 1), (1, 0), 2.0).ravel()
    if dbg: json.dump({n: v[1].tolist() for n, v in trk.items()}, open(f"{dbg}/tracks.json", "w"))
    print("tracked", flush=True)

# ---- (a) erase the label in keyframe space: Telea inpaint INSIDE the arm only; the label's right border sits on the arm's own
# outline (x ~1164-1171), so that dark edge is kept as the outline and nothing beyond it (Ricky's moving shirt) is ever touched
LBL = (1131, 511, 1169, 559)
fk_e = fk.copy()
lm = np.zeros(fk.shape[:2], np.uint8); lm[LBL[1]:LBL[3], LBL[0]:LBL[2]] = 255
fk_e = cv2.inpaint(fk_e, lm, 4, cv2.INPAINT_TELEA)
EM = np.zeros(fk.shape[:2], np.float32); EM[LBL[1] - 2:LBL[3] + 2, LBL[0] - 2:LBL[2]] = 1
EM = cv2.GaussianBlur(EM, (0, 0), 1.0)
ring = np.zeros(fk.shape[:2], np.uint8); cv2.fillPoly(ring, [ARM], 1); ring[LBL[1] - 6:LBL[3] + 6, LBL[0] - 6:LBL[2] + 6] = 0
# the patch sprite: inputs/sleeve_patch_1420MHz.png, rendered at SS x in keyframe space, centred ON the band
PC, PR, PROT = (1151.0, 535.0), (22.0, 23.5), -12.0                         # centre, radii (foreshortened across the arm), tilt deg
SS = 4
pp = cv2.imread(R + "inputs/sleeve_patch_1420MHz.png", cv2.IMREAD_UNCHANGED).astype(np.float32) / 255
pp = cv2.resize(pp, (int(2 * PR[0] * SS * 1.0), int(2 * PR[1] * SS * 1.0)), interpolation=cv2.INTER_AREA)
ph, pw = pp.shape[:2]
lum = pp[..., :3].mean(2); pal = pp[..., 3]
def patch_layer(fr_im, Wf):
    """returns (rgb, alpha) of the patch for frame k, full-frame size crop box (x0,y0,x1,y1)"""
    # sprite px (u,v) at SS -> K px: centre-relative, rotate, + PC; then K -> frame k by Wf
    a = np.deg2rad(PROT); c, s_ = np.cos(a) / SS, np.sin(a) / SS
    M1 = np.float64([[c, -s_, PC[0] - (c * pw / 2 - s_ * ph / 2)], [s_, c, PC[1] - (s_ * pw / 2 + c * ph / 2)], [0, 0, 1]])
    M = np.vstack([Wf, [0, 0, 1]]) @ M1
    cx, cy = M[0, 2] + M[0, 0] * pw / 2 + M[0, 1] * ph / 2, M[1, 2] + M[1, 0] * pw / 2 + M[1, 1] * ph / 2
    bx0, by0 = int(cx) - 40, int(cy) - 40; B = 80
    Ms = np.float64([[SS, 0, -SS * bx0], [0, SS, -SS * by0], [0, 0, 1]]) @ M
    L = cv2.warpAffine(lum, Ms[:2], (B * SS, B * SS), flags=cv2.INTER_LINEAR, borderValue=0)
    A = cv2.warpAffine(pal, Ms[:2], (B * SS, B * SS), flags=cv2.INTER_LINEAR, borderValue=0)
    L = cv2.resize(L, (B, B), interpolation=cv2.INTER_AREA); A = cv2.resize(A, (B, B), interpolation=cv2.INTER_AREA)
    reg = fr_im[by0:by0 + B, bx0:bx0 + B].astype(np.float32)
    # colours: the patch's light = this arm's jacket white, its dark = the drawing's near-black pencil; grain + shading from the frame
    hsv = cv2.cvtColor(reg.astype(np.uint8), cv2.COLOR_BGR2HSV)
    wsel = (hsv[..., 1] < 45) & (hsv[..., 2] > 170)
    white = np.median(reg[wsel], axis=0) if wsel.sum() > 30 else np.float32([228, 232, 240])
    dark = np.float32([42, 38, 48])
    t = np.clip((L - 0.18) / (0.88 - 0.18), 0, 1)[..., None]
    col = dark * (1 - t) + white * t
    gr = cv2.cvtColor(reg.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
    grain = np.clip(gr / (cv2.GaussianBlur(gr, (0, 0), 2.5) + 1), 0.85, 1.12)[..., None]
    col = col * (1 + (grain - 1) * 0.6)
    col = cv2.GaussianBlur(col, (0, 0), 0.45)
    return col, A[..., None] * 0.97, (bx0, by0, B)

SNAP = {'shL': (921.0, 419.5), 'shR': (1073.0, 407.0)}                   # snap centre near the collar end of each strap (K px)
def draw_snap(f, x, y):
    """a small metal snap: pale grey disc, dark pencil rim, tiny highlight, soft shadow; drawn only on jacket-white px (cups occlude)"""
    S2 = 8; B = 16; bx0, by0 = int(x) - B // 2, int(y) - B // 2
    cv = np.zeros((B * S2, B * S2), np.float32)
    cx, cy = (x - bx0) * S2, (y - by0) * S2
    yy, xx = np.mgrid[0:B * S2, 0:B * S2].astype(np.float32)
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / S2
    sh = np.sqrt((xx - cx - 0.8 * S2) ** 2 + (yy - cy - 0.9 * S2) ** 2) / S2
    rim = np.clip(3.6 - d, 0, 1); inner = np.clip(2.7 - d, 0, 1); hl = np.clip(1.0 - np.sqrt((xx - cx + 0.9 * S2) ** 2 + (yy - cy + 0.9 * S2) ** 2) / S2, 0, 1)
    shadow = np.clip(3.8 - sh, 0, 1) * 0.35
    ds = lambda a: cv2.resize(a, (B, B), interpolation=cv2.INTER_AREA)
    rim, inner, hl, shadow = ds(rim), ds(inner), ds(hl), ds(shadow)
    reg = f[by0:by0 + B, bx0:bx0 + B].astype(np.float32)
    hsv = cv2.cvtColor(reg.astype(np.uint8), cv2.COLOR_BGR2HSV)
    ok = cv2.GaussianBlur(((hsv[..., 2] > 150) & (hsv[..., 1] < 70)).astype(np.float32), (0, 0), 0.6)[..., None]
    out = reg * (1 - shadow[..., None] * 0.5)
    out = out * (1 - rim[..., None]) + np.float32([50, 45, 60]) * rim[..., None]
    out = out * (1 - inner[..., None]) + np.float32([196, 196, 204]) * inner[..., None]
    out = out * (1 - hl[..., None] * 0.8) + np.float32([250, 250, 252]) * hl[..., None] * 0.8
    f[by0:by0 + B, bx0:bx0 + B] = np.clip(reg * (1 - ok) + out * ok, 0, 255).astype(np.uint8)

os.makedirs(OD + "1080", exist_ok=True); os.makedirs(OD + "540", exist_ok=True)
for k in fr:
    f = rd(k); c = f[Y0:Y1, X0:X1].copy(); g = cv2.cvtColor(c, cv2.COLOR_BGR2GRAY)
    if k == K: flo = np.zeros((WH, WW, 2), np.float32)
    else: flo = dis.calc(g, gk, None)                       # k -> K: pixel p in k sits at p + flo in K
    mx, my = gx + flo[..., 0], gy + flo[..., 1]
    regD = cv2.remap(clsD, mx, my, cv2.INTER_NEAREST, borderValue=0)
    new, a = recolor(c, regD, orange_w(c))
    f[Y0:Y1, X0:X1] = new
    if do_patch:
        Wf = label_aff(LQ[k], ARMANG[k])
        er = cv2.warpAffine(fk_e, Wf, (f.shape[1], f.shape[0]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        em = cv2.warpAffine(EM, Wf, (f.shape[1], f.shape[0]), flags=cv2.INTER_LINEAR)[..., None]
        rg = cv2.warpAffine(ring, Wf, (f.shape[1], f.shape[0]), flags=cv2.INTER_NEAREST) > 0
        fo = rd(k)
        gain = (fo[rg].astype(np.float32).mean(0) + 1) / (er[rg].astype(np.float32).mean(0) + 1)
        f[:] = np.clip(f * (1 - em) + er * gain * em, 0, 255).astype(np.uint8)
        # the arm's right outline in THIS frame (scan in from Ricky's light shirt for the first dark pencil px, per row, row-median)
        (lx0, ly0), (lx1, ly1) = tf_pt(Wf, LBL[0], LBL[1]), tf_pt(Wf, LBL[2], LBL[3])
        pcx = tf_pt(Wf, PC[0], PC[1])[0]
        rows = np.arange(int(ly0) - 4, int(ly1) + 5); vv = cv2.cvtColor(fo, cv2.COLOR_BGR2HSV)[..., 2]
        # the outline is only measured where it is clean (white sleeve rows just above / below the label: nothing else is dark there),
        # then a line through those points gives the silhouette across the label rows (label text never mistaken for it)
        pts = []
        for y in list(range(int(ly0) - 16, int(ly0) - 4)) + list(range(int(ly1) + 4, int(ly1) + 16)):
            for x in range(int(lx1) + 14, int(lx1) - 14, -1):
                if vv[y, x] < 115: pts.append((y, x)); break
        xo = None
        if len(pts) > 10:
            P_ = np.array(pts, np.float64); med = np.median(P_[:, 1] - np.polyval(np.polyfit(P_[:, 0], P_[:, 1], 1), P_[:, 0]))
            fit = np.polyfit(P_[:, 0], P_[:, 1], 1); res_ = P_[:, 1] - np.polyval(fit, P_[:, 0]); keep = np.abs(res_ - med) < 2.5
            if keep.sum() > 8: fit = np.polyfit(P_[keep, 0], P_[keep, 1], 1)
            xo = np.polyval(fit, rows); xi = xo - 2.5
        if xo is not None:
            # label px left between the (warped) erase box and this outline -> inpainted from the band / outline around them
            gm = np.zeros(f.shape[:2], np.uint8)
            for i, y in enumerate(rows):   # the frame's own outline + Ricky's shirt beyond it are never replaced
                f[y, int(xi[i]):int(lx1) + 14] = fo[y, int(xi[i]):int(lx1) + 14]
            for i, y in enumerate(rows):
                if xi[i] > pcx: gm[y, int(pcx):int(xi[i])] = 255      # from the patch centre up to (never over) the outline
            bx, by = int(lx0) - 10, int(ly0) - 14
            sub = f[by:by + 80, bx:bx + 80].copy()
            f[by:by + 80, bx:bx + 80] = cv2.inpaint(sub, gm[by:by + 80, bx:bx + 80], 3, cv2.INPAINT_TELEA)
        col, al, (bx0, by0, B) = patch_layer(f, Wf)
        if xo is not None:   # the patch never crosses the arm's silhouette: it wraps round the arm there
            clip = np.ones((B, B), np.float32)
            for i, y in enumerate(rows):
                if by0 <= y < by0 + B: clip[y - by0] = np.clip(0.5 * (xo[i] + xi[i]) + 0.5 - (np.arange(B) + bx0), 0, 1)
            yy0, yy1 = rows[0] - by0, rows[-1] - by0
            if yy0 > 0: clip[:yy0] = clip[max(yy0, 0)]
            if yy1 < B - 1: clip[yy1 + 1:] = clip[yy1]
            al = al * clip[..., None]
        reg = f[by0:by0 + B, bx0:bx0 + B].astype(np.float32)
        f[by0:by0 + B, bx0:bx0 + B] = np.clip(reg * (1 - al) + col * al, 0, 255).astype(np.uint8)
    if do_epa:
        for n, (sx, sy) in SNAP.items():
            draw_snap(f, *tf(trk[n][0][k], sx, sy))
    cv2.imwrite(f"{OD}1080/f_{k:05d}.jpg", f, [cv2.IMWRITE_JPEG_QUALITY, 95])
    cv2.imwrite(f"{OD}540/f_{k:05d}.jpg", cv2.resize(f, (960, 540), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 95])
    if dbg and k % 12 == 0:
        o = rd(k)[Y0:Y1, X0:X1]
        cv2.imwrite(f"{dbg}/ab_{k:03d}.jpg", np.hstack([o, f[Y0:Y1, X0:X1]]))
    if k % 30 == 0: print(k, flush=True)
for h in ("1080", "540"):
    s = f"{R}media/act5/frames/{src}/{h}/index.json"
    if os.path.exists(s): shutil.copy(s, f"{OD}{h}/index.json")
print("done", OD)
