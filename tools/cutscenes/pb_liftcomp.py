"""Pass B paper M3: forehead lift for a bun still (03/04/05) with the pencils kept STRAIGHT and taken from the original.
    $OSPY tools/cutscenes/pb_liftcomp.py CONFIG.json
Config (crop coords): still, out, box [x0,y0,x1,y1], nbp (the NBP volume edit with the pencils REMOVED; resized to the crop), brow_y, hair_y, crown_y,
dh, dc, wx [x0,x1], pencils: [{"kind": "translate"|"slide"|"fixed", "line": [[capx,capy],[x,y]], "w": px, "ref": [x,y]}]: the upper visible
part (cap to where it enters the hair, = ref by default) moves up by the lift at ref, straight up ("translate", lower part hidden) or along
its own axis ("slide", when its lower part shows below the bun), capped by optional "max_up" (keeps a cap inside the frame);
"fixed" = that visible lower segment (exit to tip), left in place.
Method: the lift field of pb_headwarp (0 at the brows, dh at the hairline, dc at the crown and above, horizontal window) is used as a
backward map on the pencil-free NBP head (crown/bun volume, above zone_top = hair_y-50) and on the original (from zone_top+30 down to
the brows, so the hairline, the face-framing strands, the brows and the skin tint stay the approved drawing). The result takes that lifted head/hair (above the brows, inside the filled hair silhouette,
plus where the old upper pencil parts were), then the ORIGINAL pencil pixels moved rigidly (so they stay straight and keep their
drawing) on top, and the original everywhere else (background grid, face below the brows, the lower pencil tips).
Writes OUT, OUT_crop.png (the warped crop), OUT_dbg.jpg (masks)."""
import sys, json, numpy as np, cv2
from scipy.ndimage import gaussian_filter, binary_fill_holes
C = json.load(open(sys.argv[1]))
S = cv2.imread(C['still']); bx0, by0, bx1, by1 = C['box']; O = S[by0:by1, bx0:bx1].astype(np.float32)
H, W = O.shape[:2]
N = cv2.resize(cv2.imread(C['nbp']), (W, H), interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
by, hy, cy, dh, dc = C['brow_y'], C['hair_y'], C['crown_y'], C['dh'], C['dc']; x0, x1 = C['wx']
y = np.arange(H, dtype=float)
d = np.where(y >= by, 0, np.where(y >= hy, dh * (by - y) / (by - hy), np.where(y >= cy, dh + (dc - dh) * (hy - y) / (hy - cy), dc)))
d *= np.clip(y / 40.0, 0, 1)
d = np.convolve(np.pad(d, 8, mode='edge'), np.ones(9) / 9, 'same')[8:-8]
x = np.arange(W, dtype=float)
wx = np.clip(np.minimum((x - (x0 - 40)) / 40, ((x1 + 40) - x) / 40), 0, 1); wx = wx * wx * (3 - 2 * wx)
D = gaussian_filter(d[:, None] * wx[None, :], 3)
Y, X = np.meshgrid(y, x, indexing='ij')
MX, MY = X.copy(), Y + D                                   # backward map: out(y,x) = in(MY, MX)
def band(p, q, w):
    p, q = np.array(p, float), np.array(q, float); u = (q - p) / np.linalg.norm(q - p)
    rx, ry = X - p[0], Y - p[1]; t = rx * u[0] + ry * u[1]; n = np.abs(-rx * u[1] + ry * u[0])
    return ((t > -6) & (t < np.linalg.norm(q - p) + 6) & (n < w / 2)).astype(np.float32)
warp = lambda im: cv2.remap(im, MX.astype(np.float32), MY.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
Wn = warp(N)                                               # the pencil-free NBP head, lifted by the smooth field
Wb = warp(O)                                               # the original, lifted by the same field (keeps its face-framing strands)
ztop = C.get('zone_top', hy - 50)                          # above ztop: the NBP volume; below ztop+30: the lifted original
za = np.clip((y - ztop) / 30.0, 0, 1)[:, None, None]
Wn = Wn * (1 - za) + Wb * za
_h = cv2.cvtColor(Wn.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV)
hairN = cv2.dilate(((_h[..., 2] < 120) & (_h[..., 1] < 140)).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32)   # occluder for the extensions
def hairsil(im):
    hsv = cv2.cvtColor(im.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 2] < 120) & (hsv[..., 1] < 140)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)); m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m); big = 1 + np.argmax(st[1:, 4])   # the head only (not sparkles / outlines)
    return (lab == big).astype(np.uint8)
hs = np.maximum(hairsil(Wn), hairsil(O)); hs[int(by):] = 0
cl = hs.copy(); cl[int(by) - 2:int(by) + 1, int(x0):int(x1)] = 1               # close the bottom at the brow line -> forehead is a hole
head = binary_fill_holes(cl).astype(np.float32); head[int(by):] = 0
head = cv2.dilate(head, np.ones((13, 13), np.uint8)); head[int(by) - 6:] = 0
fy = np.clip((by - 6 - y) / 10, 0, 1)[:, None]                                  # feather to 0 just above the brows
pen_old = np.zeros((H, W), np.float32); pen_pix = np.zeros((H, W), np.float32); PEN = np.zeros_like(O); info = []
for P in C['pencils']:
    if P['kind'] == 'fixed': info.append(('fixed',)); continue         # a visible lower segment below the brows: stays as in the original
    (ax, ay), (bx_, by_) = P['line']; w = P['w']
    rfx, rfy = P.get('ref', P['line'][1]); Db = min(float(D[int(rfy), int(rfx)]), P.get('max_up', 1e9))
    if P['kind'] == 'translate': vx, vy = 0.0, -Db                    # lower part hidden: straight up by the lift where it enters the hair
    else:                                                              # 'slide': along its own axis, collinear with its fixed lower part
        u = np.array([bx_ - ax, by_ - ay], float); u /= np.linalg.norm(u); vx, vy = -u[0] * Db / abs(u[1]), -Db
    u = np.array([bx_ - ax, by_ - ay], float); L = np.linalg.norm(u); u /= L
    def pencil_pixels(sh, p0, p1):                       # pencil-coloured pixels of the original moved by sh, inside band p0-p1
        Wp = cv2.warpAffine(O, np.float32([[1, 0, sh[0]], [0, 1, sh[1]]]), (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        bn = band(p0, p1, w + 2)
        hsv = cv2.cvtColor(Wp.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV); Hh, Ss, Vv = [hsv[..., i].astype(int) for i in range(3)]
        nonhair = ((Vv > 125) | (Ss > 110)).astype(np.uint8)
        col = (((Hh >= 8) & (Hh <= 26) & (Ss > 140)) | (((Hh > 150) | (Hh < 6)) & (Ss > 35)) | ((Hh >= 95) & (Hh <= 130) & (Ss > 50))
               | (Vv < 160) | ((Ss < 45) & (Vv < 215))).astype(np.uint8)      # pencil colours, not paper / spotlight streaks
        pm = cv2.morphologyEx((bn * nonhair * col).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        pm = binary_fill_holes(pm).astype(np.uint8) * (bn > 0)
        n, lab, st, _ = cv2.connectedComponentsWithStats(pm.astype(np.uint8)); keep = np.zeros((H, W), np.float32)
        for i in range(1, n):
            if st[i, 4] >= 40: keep[lab == i] = 1
        return Wp, keep
    e0 = np.array([bx_ + vx, by_ + vy])
    Wp, keep = pencil_pixels((vx, vy), [ax + vx, ay + vy], e0)
    PEN = PEN * (1 - keep[..., None]) + Wp * keep[..., None]; pen_pix = np.maximum(pen_pix, keep)
    for j in range(C.get('extend_steps', 4)):            # continue the body into the (higher) new hair until the hair covers it
        sh = np.array([vx, vy]) + u * (12 * j + 20)
        Wk, kk = pencil_pixels(sh, e0 + u * 12 * j, e0 + u * 12 * (j + 1))
        kk = cv2.morphologyEx((kk * (1 - hairN) * (1 - pen_pix)).astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        near = cv2.dilate(pen_pix.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0       # only pieces that continue the pencil
        n, lab, st, _ = cv2.connectedComponentsWithStats(kk.astype(np.uint8)); kk = np.zeros((H, W), np.float32)
        for i in range(1, n):
            if st[i, 4] >= 40 and near[lab == i].any(): kk[lab == i] = 1
        if kk.sum() == 0: break                           # hidden by the hair from here on
        PEN = PEN * (1 - kk[..., None]) + Wk * kk[..., None]; pen_pix = np.maximum(pen_pix, kk)
    pen_old = np.maximum(pen_old, band(*P['line'], w + 8)); info.append((P['kind'], round(vx, 1), round(vy, 1)))
core = np.clip(gaussian_filter(head, 3) * fy + np.clip(gaussian_filter(cv2.dilate(pen_old, np.ones((7, 7))), 2) * 1.5, 0, 1), 0, 1)
R = O * (1 - core[..., None]) + Wn * core[..., None]                            # old pencils (upper parts) are gone with the NBP head
# ring around the head: the original background (grid stays straight) without the original's loose outer strands, plus the NBP's strands
ring = np.clip(gaussian_filter(cv2.dilate(head, np.ones((31, 31), np.uint8)), 3), 0, 1) * fy * (1 - core)
def darkneutral(im):
    hsv = cv2.cvtColor(im.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV)
    return np.clip((175 - hsv[..., 2].astype(np.float32)) / 50, 0, 1) * (hsv[..., 1] < 120)
Oc = cv2.medianBlur(O.clip(0, 255).astype(np.uint8), 9).astype(np.float32); od = cv2.dilate(darkneutral(O), np.ones((3, 3)))[..., None]
Oclean = O * (1 - od) + Oc * od
wd = darkneutral(Wn)[..., None]; ringpix = Oclean * (1 - wd) + Wn * wd
R = R * (1 - ring[..., None]) + ringpix * ring[..., None]
reg = np.maximum(core, ring)
pmf = np.clip(gaussian_filter(pen_pix, 0.6) * 1.15, 0, 1)
R = R * (1 - pmf[..., None]) + PEN * pmf[..., None]
out = S.copy(); out[by0:by1, bx0:bx1] = R.clip(0, 255).round().astype(np.uint8)
cv2.imwrite(C['out'], out); cv2.imwrite(C['out'][:-4] + '_crop.png', out[by0:by1, bx0:bx1])
dbg = np.concatenate([np.stack([reg] * 3, -1) * 255, np.stack([pmf * 255, pen_old * 255, np.clip(D / max(dc, 1), 0, 1) * 255], -1)], 1)
cv2.imwrite(C['out'][:-4] + '_dbg.jpg', dbg.astype(np.uint8))
print(C['out'], info, 'max lift', round(float(D.max()), 1))
