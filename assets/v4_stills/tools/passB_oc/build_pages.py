#!/usr/bin/env python3
"""v4 Pass B (open_close): ONE paper plate for the opening page (#01) and the outro page (#11), plus the overlays the
engine animates. All exact text is set here in code with the same hand() / stamp() as the approved stills (compose.py).

Inputs
  work/passB_oc/plate01_clean_a.png  NBP edit of work/s01_a.png: pencil, its shadow and the floor stroke removed (0 px shift)
  work/s01_a.png                     the approved #01 drawing (source of the pencil sprite and the floor stroke)
  work/s11_page.png                  the approved #11 colour drawing on page11.py's synthetic paper (same placement as #01)
Outputs (media/act5/tex/, 1920x1080 frame space; *_half = 960x540)
  page_plate.jpg          the one plate (paper + gutter), no drawing
  page01(.jpg|_half.jpg)  plate x graphite drawing (#01, no pencil, no 一, no text)
  page11(.jpg|_half.jpg)  plate x colour drawing  (#11, no text)
  yi01.png                the graphite 一 floor stroke (RGBA), revealed left -> right by the engine
  pencil01.png            the yellow pencil, axis-aligned (tip at the right end), RGBA; pencil01_shadow.png (blurred alpha)
  slate01.png, ded01.png, cap11a.png, cap11b.png, ded11.png, stamp11.png   text overlays (RGBA)
  page_layout.json        every overlay's placement (frame px, top-left) + the pencil geometry
usage: .venv/bin/python assets/v4_stills/tools/passB_oc/build_pages.py"""
import json, sys, numpy as np
from PIL import Image
from scipy import ndimage
R = '/home/jade/Documents/vibesong/'
sys.path.insert(0, R + 'assets/v4_stills/tools')
from compose import hand, stamp            # the approved stills' text functions (same fonts, grain, tilt)
WK = R + 'assets/v4_stills/work/'; OUT = R + 'media/act5/tex/'
FW, FH = 1920, 1080
DED = 'For every partial project in a drawer.'

def lum(a): return a @ np.array([0.299, 0.587, 0.114], np.float32)

C = np.asarray(Image.open(WK + 'passB_oc/plate01_clean_a.png').convert('RGB'), np.float32)   # 2752x1536
S01 = np.asarray(Image.open(WK + 's01_a.png').convert('RGB'), np.float32)
H, W = C.shape[:2]

# ------------------------------------------------------------------ the plate: C outside the drawing, synthetic paper inside
L = lum(C)
dark = (ndimage.gaussian_filter(L, 10) - L) > 5
m = ndimage.binary_dilation(dark, iterations=14)
m[:, int(W * 0.86):] = False                     # never touch the gutter / page edge strip (no drawing there)
m = ndimage.binary_closing(m, iterations=25)
keep = (~m).astype(np.float32)
low = None                                         # normalised convolution, coarse scales fill the big holes
for sg in (300, 120, 40):
    wsum = ndimage.gaussian_filter(keep, sg)
    est = np.stack([ndimage.gaussian_filter(C[..., k] * keep, sg) for k in range(3)], -1) / np.maximum(wsum, 1e-6)[..., None]
    if low is None: low = est
    else: wgt = np.clip(wsum / 0.25, 0, 1)[..., None]; low = est * wgt + low * (1 - wgt)
patch = C[60:460, 60:900]                        # empty paper, top-left: its grain
g = patch - ndimage.gaussian_filter(patch, (6, 6, 0))
t = np.concatenate([g, g[:, ::-1]], 1); t = np.concatenate([t, t[::-1]], 0)
G = np.tile(t, (H // t.shape[0] + 1, W // t.shape[1] + 1, 1))[:H, :W]
wm = ndimage.gaussian_filter(m.astype(np.float32), 6)[..., None]
plate = C * (1 - wm) + (low + G) * wm
D01 = np.clip(C / np.maximum(plate, 1), 0, 1)
D01 = 1 - (1 - D01) * np.clip(ndimage.gaussian_filter(m.astype(np.float32), 3), 0, 1)[..., None]   # exactly 1 off-drawing

# ------------------------------------------------------------------ #11 colour layer = s11_page / page11.py's paper (recomputed exactly)
A = S01; patch = A[40:440, 40:740]
base = np.median(patch.reshape(-1, 3), 0)
g = patch - ndimage.gaussian_filter(patch, (6, 6, 0))
t = np.concatenate([g, g[:, ::-1]], 1); t = np.concatenate([t, t[::-1]], 0)
G11 = np.tile(t, (H // t.shape[0] + 1, W // t.shape[1] + 1, 1))[:H, :W]
yy, xx = np.mgrid[0:H, 0:W]; vig = 1 - 0.05 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
paper11 = np.clip(base[None, None] * vig[..., None] + G11, 0, 255)
P11 = np.asarray(Image.open(WK + 'passB_oc/s11_page_tipfix.png').convert('RGB'), np.float32)   # tipfix11.py: canon (pencil point hidden)
D11 = np.clip(P11 / np.maximum(paper11, 1), 0, 1)
D11 = np.where(D11 > 0.985, 1.0, D11)            # paper grain residue -> exactly 1 (the plate carries the grain)

def save_frame(a, name, q=93):
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((FW, FH), Image.LANCZOS)
    im.save(OUT + name + '.jpg', quality=q); im.resize((FW // 2, FH // 2), Image.LANCZOS).save(OUT + name + '_half.jpg', quality=q)
    return im
save_frame(plate, 'page_plate'); p01 = save_frame(plate * D01, 'page01'); p11 = save_frame(plate * D11, 'page11')

# ------------------------------------------------------------------ frame-space helpers (2752x1536 -> 1920x1080, as compose.fit)
sx, sy = FW / W, FH / H
lay = {'frame': [FW, FH]}
def save_rgba(name, rgb, a, x0, y0):
    im = Image.fromarray(np.dstack([np.broadcast_to(np.asarray(rgb, np.float32), a.shape + (3,)) if np.ndim(rgb) == 1 else rgb, a * 255]).astype(np.uint8), 'RGBA')
    im.save(OUT + name + '.png'); lay[name] = {'x': int(x0), 'y': int(y0), 'w': im.width, 'h': im.height}

# ------------------------------------------------------------------ the 一 floor stroke (the approved stroke, stretched to its full length)
y0s, y1s, x0s, x1s = 1270, 1385, 270, 1330           # band in s01_a px that holds the stroke (left of the pencil tip)
band = np.clip(1 - lum(S01[y0s:y1s, x0s:x1s]) / np.maximum(lum(C[y0s:y1s, x0s:x1s]), 1), 0, 1)
band = np.clip((band - 0.08) / 0.8, 0, 1)
band[:, int((1300 - x0s)):] *= np.linspace(1, 0, band.shape[1] - int(1300 - x0s))[None]   # fade the tip clump
ys, xs = np.nonzero(band > 0.05)
# keep only the ground band (not Charlie's stool/legs above it): rows at/below the stroke's top
prof = band.mean(1); r0 = max(0, int(np.argmax(prof > 0.06)) - 4)
band[:r0] = 0
yi = Image.fromarray((band * 255).astype(np.uint8))
YI_X0, YI_X1 = 210, 1090                              # frame px: the 一 runs under Charlie, stops before the desk
yw = YI_X1 - YI_X0; yh = round(band.shape[0] * sy)
yi = yi.resize((yw, yh), Image.LANCZOS)
save_rgba('yi01', (52, 50, 54), np.asarray(yi, np.float32) / 255, YI_X0, round(y0s * sy))

# ------------------------------------------------------------------ the pencil (axis-aligned strip; tip at the right end)
c = np.array([1964.65, 526.75]); d = np.array([-0.64965, 0.76023]); nrm = np.array([-d[1], d[0]])
T0, T1, WW = -800, 1120, 130
tt, ww = np.meshgrid(np.arange(T0, T1), np.arange(-WW, WW + 1))
X = c[0] + tt * d[0] + ww * nrm[0]; Y = c[1] + tt * d[1] + ww * nrm[1]
strip = np.stack([ndimage.map_coordinates(S01[..., k], [Y, X], order=1, cval=255) for k in range(3)], -1)
# geometry in strip px (cols = T - T0, rows = W + WW): body edges, cone start, tip
TOP = lambda col: 46 + (43 - 46) * (col - 230) / (1460 - 230)
BOT = lambda col: 223 + (214 - 223) * (col - 230) / (1460 - 230)
CONE, TIP = 1460, (1840, 111)
EXT = 1100                                           # extend the body backwards (the top end is off-frame in the still)
body = strip[:, 300:1300]
ext = np.concatenate([body[:, ::-1], body] * 2, 1)[:, :EXT + 230 - 300 + 300]
full = np.concatenate([ext[:, -(EXT + 230):], strip[:, 230:]], 1)     # col 0 = new far end; strip col 230 -> EXT+230
ss = 4; Hh, Wf = full.shape[:2]
gy, gx = np.mgrid[0:Hh * ss, 0:Wf * ss] / ss
cs = gx - (EXT + 230) + 230                           # strip col coordinate
inb = (cs < CONE) & (gy >= TOP(np.minimum(cs, CONE))) & (gy <= BOT(np.minimum(cs, CONE)))
u = (cs - CONE) / (TIP[0] - CONE)
inc = (cs >= CONE) & (u <= 1) & (gy >= TOP(CONE) + (TIP[1] - TOP(CONE)) * u) & (gy <= BOT(CONE) + (TIP[1] - BOT(CONE)) * u)
alpha = (inb | inc).astype(np.float32).reshape(Hh, ss, Wf, ss).mean((1, 3))
alpha[:, :24] *= np.linspace(0, 1, 24)[None]          # soft far end (it is always off-frame)
cut = TIP[0] - 230 + EXT + 230 + 4
full, alpha = full[:, :cut], alpha[:, :cut]
k = sx                                                 # strip px -> frame px
pw, ph = round(full.shape[1] * k), round(full.shape[0] * k)
pim = Image.fromarray(np.dstack([full, alpha * 255]).astype(np.uint8), 'RGBA').resize((pw, ph), Image.LANCZOS)
pim.save(OUT + 'pencil01.png')
# shadow: the pencil's alpha, padded + blurred (the engine shears it so it meets the tip on the paper)
PAD = 60
sa = np.pad(np.asarray(pim.split()[3], np.float32) / 255, PAD)
sa = ndimage.gaussian_filter(sa, 16)
Image.fromarray((sa * 255).astype(np.uint8), 'L').save(OUT + 'pencil01_shadow.png')
tip_strip = np.array([TIP[0] - 230 + EXT + 230, TIP[1]]) * k
tip_img = c + (TIP[0] + T0) * d + (TIP[1] - WW) * nrm   # tip in s01_a px
lay['pencil01'] = {'w': pw, 'h': ph, 'tip': [round(tip_strip[0], 1), round(tip_strip[1], 1)], 'angle_deg': round(float(np.degrees(np.arctan2(d[1], d[0]))), 3),
                   'tip_in_still': [round(tip_img[0] * sx, 1), round(tip_img[1] * sy, 1)], 'shadow_pad': PAD}

# ------------------------------------------------------------------ text (same calls as compose.py; on a transparent layer)
def text_layer(name, xy, txt, size, color=(59, 58, 64), rot=-1.2, seed=3, alpha=0.92):
    cv = Image.new('RGB', (FW, FH), (0, 0, 0)); ref = Image.new('RGB', (FW, FH), (0, 0, 0))
    # hand() pastes colour through its own mask: paint white-on-black to recover the mask
    hand(cv, xy, txt, size, color=(255, 255, 255), rot=rot, seed=seed, alpha=alpha)
    a = np.asarray(cv, np.float32)[..., 0] / 255
    ys, xs = np.nonzero(a > 0.002); x0, x1, y0, y1 = xs.min() - 2, xs.max() + 3, ys.min() - 2, ys.max() + 3
    save_rgba(name, color, a[y0:y1, x0:x1], x0, y0)
# (v4.3, Jade 10-19) the order is dedication first, then the subtitle (year at the end, in parentheses): dedication on top,
# the larger line; the subtitle under it, smaller (the M1 layout had the slate on top at 56 and the dedication under it at 40)
text_layer('ded01', (118, 120), DED, 52, rot=1.0, seed=13)
text_layer('slate01', (122, 208), 'a song about product management (2011)', 40, rot=0.8, seed=11)
text_layer('cap11a', (118, 104), 'Charlie wrote this about product management in 2011.', 40, rot=1.0, seed=21)
text_layer('cap11b', (118, 166), 'We shipped The Vibe Coding Song in 2026.', 40, rot=0.6, seed=22)
text_layer('ded11', (118, 262), DED, 50, color=(52, 70, 120), rot=0.8, seed=23)
col, sm = stamp('SAVE COMPLETE', '· 2026 ·')
# (Pass B) the shared plate has the page edge at x ~1740 (the approved #11 had a clean plate): the stamp is 0.86x and
# 60 px further left so it stays on the page, clear of the captions
SK = 0.86; sm = sm.resize((round(sm.width * SK), round(sm.height * SK)), Image.LANCZOS)
save_rgba('stamp11', np.asarray(col.resize(sm.size), np.float32), np.asarray(sm, np.float32) / 255, 1192, 96)
json.dump(lay, open(OUT + 'page_layout.json', 'w'), indent=1)

# ------------------------------------------------------------------ reference composites (what the engine should reproduce)
def comp(base, names):
    im = base.copy().convert('RGBA')
    for nme in names:
        o = Image.open(OUT + nme + '.png').convert('RGBA'); im.alpha_composite(o, (lay[nme]['x'], lay[nme]['y']))
    return im.convert('RGB')
comp(p01, ['yi01', 'slate01', 'ded01']).save(WK + 'passB_oc/ref01_text.jpg', quality=92)
comp(p11, ['cap11a', 'cap11b', 'ded11', 'stamp11']).save(WK + 'passB_oc/ref11_text.jpg', quality=92)
print(json.dumps(lay))

# ------------------------------------------------------------------ (M1 call 7) the next page's paper beyond the page's right edge:
# the plate's last 90 px (next page, past the gutter) mirrored out to 600 px, so nothing else shows there while page #11 settles
pl = np.asarray(Image.open(OUT + 'page_plate.jpg').convert('RGB'), np.float32)
col = np.median(pl[0:400, 1880:1920].reshape(-1, 3), 0)            # the next page's paper (past the page edge), flat
gr = pl[60:460, 60:660] - ndimage.gaussian_filter(pl[60:460, 60:660], (6, 6, 0))   # + the plate's own grain
ext = col[None, None] + np.tile(gr, (3, 1, 1))[:1080, :600]
Image.fromarray(ext.astype(np.uint8)).save(OUT + 'page_edge.jpg', quality=93)
Image.fromarray(ext.astype(np.uint8)).resize((300, 540), Image.LANCZOS).save(OUT + 'page_edge_half.jpg', quality=93)
