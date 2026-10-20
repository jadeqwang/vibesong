"""v4.7 v47_outro: the same jacket fixes on the outro's END page (media/act5/tex/page11*.jpg, the 2011 page in colour with all three,
on screen 195.4-203): its sleeve patch is a blue disc of gibberish and both shoulders carry orange strips.
  - shoulder strips (orange) -> jacket white (Lab chroma -> nearby white, L additive), + a small snap at each strap's collar end
  - the blue patch -> erased (Telea inside the arm), round b/w 1420 MHz patch (inputs/sleeve_patch_1420MHz.png) centred ON the band,
    clipped at the arm's outline
Hem and cuffs on this page are already white; bands untouched. Writes page11.jpg + page11_half.jpg (originals kept as *_v46.jpg).
    $OSPY tools/cutscenes/pb_spread47_page11.py [--debug=DIR]"""
import sys, os, shutil, numpy as np, cv2
R = "/home/jade/Documents/vibesong/"
T = R + "media/act5/tex/"
if not os.path.exists(T + "page11_v46.jpg"):
    shutil.copy(T + "page11.jpg", T + "page11_v46.jpg"); shutil.copy(T + "page11_half.jpg", T + "page11_half_v46.jpg")
im = cv2.imread(T + "page11_v46.jpg"); src = im.copy()
dbg = dict((a[2:].split('=', 1) + [''])[:2] for a in sys.argv[1:] if a.startswith('--')).get('debug')

# 1) shoulder strips -> white
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(np.float32); h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
th = 110 + 40 * np.clip((v - 130) / 60, 0, 1)
w = np.clip(1 - np.maximum(0, np.abs(h - 11) - 8) / 3, 0, 1) * np.clip((s - th) / 35, 0, 1) * np.clip((v - 115) / 40, 0, 1)
lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
# on this still the strips are drawn with pale-orange pencil at their edges too: inside the strip boxes any orange-hued px counts
wl = np.clip(1 - np.maximum(0, np.abs(h - 11) - 8) / 3, 0, 1) * np.clip((s - 45) / 40, 0, 1) * np.clip((v - 115) / 40, 0, 1)
for (x0, y0, x1, y1) in [(1041, 591, 1074, 618), (954, 595, 970, 609)]:
    reg = np.zeros(w.shape, np.float32); reg[y0:y1, x0:x1] = 1
    a = np.maximum(w, wl) * reg
    nb = lab[y0 - 25:y1 + 25, x0 - 25:x1 + 25]; hs = hsv[y0 - 25:y1 + 25, x0 - 25:x1 + 25]
    wr = np.median(nb[(hs[..., 1] < 40) & (hs[..., 2] > 200)], axis=0)
    osel = a > 0.9
    orr = np.median(lab[osel], axis=0) if osel.sum() > 10 else np.median(lab[a > 0.3], axis=0) if (a > 0.3).sum() > 5 else None
    if orr is None: continue
    new = lab.copy(); new[..., 0] = np.clip(wr[0] + (lab[..., 0] - orr[0]) * 0.3, 0, 248)   # compressed: the orange's shading strokes must not turn into grey lines
    new[..., 1] = wr[1] + (lab[..., 1] - orr[1]) * 0.05; new[..., 2] = wr[2] + (lab[..., 2] - orr[2]) * 0.05
    ac = np.clip(2 * a, 0, 1)[..., None]; al = (a * a)[..., None]
    lab[..., :1] = lab[..., :1] * (1 - al) + new[..., :1] * al; lab[..., 1:] = lab[..., 1:] * (1 - ac) + new[..., 1:] * ac
im = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)

# 2) the patch
OC, ORX, ORY = (1080.5, 643.5), 9.5, 12.5                              # the old blue disc
PC, PR, ROT = (1078.5, 648.5), (9.5, 12.0), -22.0                       # new: centred on the band, tilted with the arm
def xline(y): return 1072.0 + 0.45 * (y - 612.0) - 1.6      # the arm's right outline (inner edge; outer edge measured 612-674) across the patch rows
yy, xx = np.mgrid[0:im.shape[0], 0:im.shape[1]].astype(np.float32)
old = ((((xx - OC[0]) / (ORX + 3.0)) ** 2 + ((yy - OC[1]) / (ORY + 3.0)) ** 2) < 1) & (xx < xline(yy) + 0.8)
im = cv2.inpaint(im, old.astype(np.uint8) * 255, 3, cv2.INPAINT_TELEA)
# (the arm outline itself was never under the old disc: kept as drawn) any blue left on the outline's inner edge -> neutral
hb = cv2.cvtColor(im, cv2.COLOR_BGR2HSV); bl = (hb[..., 0] > 95) & (hb[..., 0] < 130) & (hb[..., 1] > 40) & ((((xx - OC[0]) / (ORX + 3)) ** 2 + ((yy - OC[1]) / (ORY + 3)) ** 2) < 1)
g_ = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY); im[bl] = np.stack([g_[bl]] * 3, 1)
SS = 8
pp = cv2.imread(R + "inputs/sleeve_patch_1420MHz.png", cv2.IMREAD_UNCHANGED).astype(np.float32) / 255
pw, ph = int(2 * PR[0] * SS), int(2 * PR[1] * SS)
pp = cv2.resize(pp, (pw, ph), interpolation=cv2.INTER_AREA)
B = 48; bx0, by0 = int(PC[0]) - B // 2, int(PC[1]) - B // 2
a_ = np.deg2rad(ROT); c, s_ = np.cos(a_), np.sin(a_)
# sprite px -> SS canvas of the box: rotate about the sprite centre, place at PC
M = np.float64([[c, -s_, 0], [s_, c, 0]])
cx_, cy_ = (PC[0] - bx0) * SS, (PC[1] - by0) * SS
M[:, 2] = [cx_ - (c * pw / 2 - s_ * ph / 2), cy_ - (s_ * pw / 2 + c * ph / 2)]
lum = pp[..., :3].mean(2)
yy3, xx3 = np.mgrid[0:ph, 0:pw].astype(np.float32); rr = np.sqrt(((xx3 - pw / 2) / (pw / 2)) ** 2 + ((yy3 - ph / 2) / (ph / 2)) ** 2)
lum = np.where(rr < 0.80, lum.max(), lum)          # BLANK centre: ~19 px wide here, text would only read as gibberish
L = cv2.warpAffine(lum, M, (B * SS, B * SS), flags=cv2.INTER_LINEAR)
A = cv2.warpAffine(pp[..., 3], M, (B * SS, B * SS), flags=cv2.INTER_LINEAR)
L = cv2.resize(L, (B, B), interpolation=cv2.INTER_AREA); A = cv2.resize(A, (B, B), interpolation=cv2.INTER_AREA)
reg = im[by0:by0 + B, bx0:bx0 + B].astype(np.float32)
hs = cv2.cvtColor(reg.astype(np.uint8), cv2.COLOR_BGR2HSV)
white = np.median(reg[(hs[..., 1] < 40) & (hs[..., 2] > 200)], axis=0); dark = np.float32([45, 42, 52])
t = np.clip((L - 0.18) / 0.70, 0, 1)[..., None]; col = dark * (1 - t) + white * t
gr = cv2.cvtColor(reg.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
col = col * (1 + (np.clip(gr / (cv2.GaussianBlur(gr, (0, 0), 2.0) + 1), 0.88, 1.1)[..., None] - 1) * 0.6)
col = cv2.GaussianBlur(col, (0, 0), 0.45)
by_, bx_ = np.mgrid[by0:by0 + B, bx0:bx0 + B].astype(np.float32)
clip = np.clip(xline(by_) + 0.5 - bx_, 0, 1)
al = (A * clip)[..., None] * 0.97
im[by0:by0 + B, bx0:bx0 + B] = np.clip(reg * (1 - al) + col * al, 0, 255).astype(np.uint8)

# 3) snaps at the straps' collar ends (only on jacket-white px)
def snap(f, x, y, r=2.6):
    S2 = 8; Bs = 12; x0, y0 = int(x) - Bs // 2, int(y) - Bs // 2
    yy2, xx2 = np.mgrid[0:Bs * S2, 0:Bs * S2].astype(np.float32); cx, cy = (x - x0) * S2, (y - y0) * S2
    d = np.sqrt((xx2 - cx) ** 2 + (yy2 - cy) ** 2) / S2
    ds = lambda q: cv2.resize(q, (Bs, Bs), interpolation=cv2.INTER_AREA)[..., None]
    rim, inner = ds(np.clip(r - d, 0, 1)), ds(np.clip(r - 0.9 - d, 0, 1))
    hl = ds(np.clip(0.8 - np.sqrt((xx2 - cx + 0.7 * S2) ** 2 + (yy2 - cy + 0.7 * S2) ** 2) / S2, 0, 1))
    sh = ds(np.clip(r + 0.2 - np.sqrt((xx2 - cx - 0.7 * S2) ** 2 + (yy2 - cy - 0.8 * S2) ** 2) / S2, 0, 1)) * 0.3
    rg = f[y0:y0 + Bs, x0:x0 + Bs].astype(np.float32); hs2 = cv2.cvtColor(rg.astype(np.uint8), cv2.COLOR_BGR2HSV)
    ok = cv2.GaussianBlur(((hs2[..., 2] > 150) & (hs2[..., 1] < 70)).astype(np.float32), (0, 0), 0.6)[..., None]
    o = rg * (1 - sh * 0.5); o = o * (1 - rim) + np.float32([50, 45, 60]) * rim; o = o * (1 - inner) + np.float32([196, 196, 204]) * inner
    o = o * (1 - hl * 0.8) + np.float32([250, 250, 252]) * hl * 0.8
    f[y0:y0 + Bs, x0:x0 + Bs] = np.clip(rg * (1 - ok) + o * ok, 0, 255).astype(np.uint8)
snap(im, 1047.0, 596.5); snap(im, 963.0, 601.5, r=1.9)

cv2.imwrite(T + "page11.jpg", im, [cv2.IMWRITE_JPEG_QUALITY, 95])
cv2.imwrite(T + "page11_half.jpg", cv2.resize(im, (im.shape[1] // 2, im.shape[0] // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 95])
if dbg:
    os.makedirs(dbg, exist_ok=True)
    z = lambda q: cv2.resize(q[570:700, 930:1110], None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
    cv2.imwrite(dbg + "/page11_ab.jpg", np.hstack([z(src), z(im)]))
print("page11 done")
