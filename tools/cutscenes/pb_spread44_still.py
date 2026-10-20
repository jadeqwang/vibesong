"""v4.4 spread (unit v44_spread): build the new right-page still for the outro living layer.
  $OSPY tools/cutscenes/pb_spread44_still.py SRC.png OUT_RECT.png [--yv=40 --hv=1000]
1. remove the two lower pencil tips that NBP drew poking out of the bun (canon: tips hidden) -> Telea inpaint inside hand polygons
2. colour-match the NBP paper to the spread paper, scale the vignette to height HV px and paste it (feathered rectangle) into the
   1920x1080 spreadR rect crop of the v11 spread (media/act5/stills/spread_right_crop_v11.jpg), centred on the right page (x 192..1843).
Writes OUT_RECT.png (1920x1080, the Seedance first frame) and OUT_RECT minus .png + _clean.png (tips removed, NBP size)."""
import sys, numpy as np, cv2
src, out = sys.argv[1], sys.argv[2]
opt = dict(a[2:].split('=') for a in sys.argv[3:] if a.startswith('--'))
YV, HV = int(opt.get('yv', 40)), int(opt.get('hv', 1000))
im = cv2.imread(src)
# tip polygons (NBP still_b1g1 px)
TIPS = [[(1090 + x, 330 + y) for x, y in [(14, 73), (39, 47), (77, 23), (81, 28), (75, 50), (52, 61), (30, 69)]],
        [(1390 + x, 330 + y) for x, y in [(15, 26), (19, 24), (60, 51), (88, 78), (80, 77), (50, 64), (21, 47)]]]
m = np.zeros(im.shape[:2], np.uint8)
for p in TIPS: cv2.fillPoly(m, [np.array(p, np.int32)], 255)
m = cv2.dilate(m, np.ones((7, 7), np.uint8))
clean = cv2.inpaint(im, m, 6, cv2.INPAINT_TELEA)
cv2.imwrite(out.replace('.png', '_clean.png'), clean)
base = cv2.imread('/home/jade/Documents/vibesong/media/act5/stills/spread_right_crop_v11.jpg')
# blank the old vignette (x 290..1775): per-column paper profile interpolated between the top rows (0-4) and the bottom rows
# (1062-1078), smoothed, plus paper grain (high-pass of the blank strip x 1772..1840, mirrored to width)
X0, X1 = 290, 1775
top = np.median(base[0:5, X0:X1].astype(np.float32), 0); bot = np.median(base[1062:1079, X0:X1].astype(np.float32), 0)
top = cv2.GaussianBlur(top[None], (0, 0), 25)[0]; bot = cv2.GaussianBlur(bot[None], (0, 0), 25)[0]
t = np.linspace(0, 1, base.shape[0], dtype=np.float32)[:, None, None]
fill = top[None] * (1 - t) + bot[None] * t
ref = base[1062:1079, 1000:1100].astype(np.float32); sd = float((ref - cv2.GaussianBlur(ref, (0, 0), 3)).std())
rng = np.random.default_rng(44); g = cv2.GaussianBlur(rng.normal(0, 1, (base.shape[0], X1 - X0)).astype(np.float32), (0, 0), 0.8)
g = (g / g.std() * sd)[..., None]
fill = fill + g
fx = np.ones(X1 - X0, np.float32); r = np.clip(np.arange(X1 - X0) / 30, 0, 1); fx = np.minimum(r, r[::-1])[None, :, None]
b2 = base.astype(np.float32); b2[:, X0:X1] = b2[:, X0:X1] * (1 - fx) + fill * fx
base = np.clip(b2, 0, 255).astype(np.uint8)
cv2.imwrite(out.replace('.png', '_blank.png'), base)
# paper colour: NBP margins (outer 2 % frame) vs blank page area in the base (right page, below the old vignette)
h, w = clean.shape[:2]; b = int(0.02 * h)
nbp_paper = np.median(np.concatenate([clean[:b].reshape(-1, 3), clean[-b:].reshape(-1, 3)]), 0)
sp_paper = np.median(base[1055:1078, 300:1700].reshape(-1, 3), 0)
gain = sp_paper / np.maximum(nbp_paper, 1)
print('paper nbp', nbp_paper, 'spread', sp_paper, 'gain', gain)
v = np.clip(clean.astype(np.float32) * gain, 0, 255)
WV = int(round(w * HV / h)); v = cv2.resize(v, (WV, HV), interpolation=cv2.INTER_AREA)
x0 = int(round((192 + 1843) / 2 - WV / 2)); print('vignette at x', x0, x0 + WV, 'y', YV, YV + HV)
F = 36
a = np.ones((HV, WV), np.float32)
ramp = lambda n: np.clip(np.arange(n) / F, 0, 1)
a *= np.minimum(ramp(WV), ramp(WV)[::-1])[None, :]; a *= np.minimum(ramp(HV), ramp(HV)[::-1])[:, None]
a = a[..., None]
outim = base.astype(np.float32)
roi = outim[YV:YV + HV, x0:x0 + WV]
outim[YV:YV + HV, x0:x0 + WV] = roi * (1 - a) + v * a
cv2.imwrite(out, np.clip(outim, 0, 255).astype(np.uint8))
