"""v4.5 v45_ricky: Aleph keyframe = take B's own frame (720p) with Ricky replaced by the fixed first frame's Ricky (ff_<tag>.jpg vs ff_g1.jpg),
warped into take B's frame geometry (ECC affine ff_g1@720 -> frame) and colour-matched per channel in the Ricky box.
    $OSPY tools/cutscenes/pb_spread45_key.py TAG FRAME.png OUT.png"""
import sys, numpy as np, cv2
tag, fpath, out = sys.argv[1:4]
W = "/home/jade/Documents/vibesong/media/act5/_work/"
f0 = cv2.imread(fpath); H, Wd = f0.shape[:2]
g1 = cv2.resize(cv2.imread(W + "v44/ff_g1.jpg"), (Wd, H), interpolation=cv2.INTER_AREA)
r1 = cv2.resize(cv2.imread(W + f"v45/ff_{tag}.jpg"), (Wd, H), interpolation=cv2.INTER_AREA)
gr = lambda a: cv2.cvtColor(a, cv2.COLOR_BGR2GRAY).astype(np.float32)
M = np.eye(2, 3, dtype=np.float32)
cc, M = cv2.findTransformECC(gr(g1), gr(f0), M, cv2.MOTION_AFFINE, (3, 200, 1e-6), None, 5)
g1w = cv2.warpAffine(g1, M, (Wd, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
r1w = cv2.warpAffine(r1, M, (Wd, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
print("ecc", round(cc, 4), "resid g1w vs frame", np.abs(g1w.astype(int) - f0.astype(int)).mean().round(2))
# changed region (Ricky) = where the fixed still differs from the old one, closed + dilated + feathered
d = np.abs(r1w.astype(np.float32) - g1w.astype(np.float32)).mean(2)
m = (d > 10).astype(np.uint8) * 255
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8)); m = cv2.dilate(m, np.ones((9, 9), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(m)
keep = np.zeros_like(m)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] > 400: keep[lab == i] = 255
a = cv2.GaussianBlur(keep.astype(np.float32) / 255, (0, 0), 3)[..., None]
# colour: per-channel linear map g1w -> f0 fitted around Ricky (box of the mask, dilated), applied to r1w
ys, xs = np.where(keep > 0); x0, x1, y0, y1 = max(xs.min() - 40, 0), min(xs.max() + 40, Wd), max(ys.min() - 40, 0), min(ys.max() + 40, H)
A = g1w[y0:y1, x0:x1].reshape(-1, 3).astype(np.float32); B = f0[y0:y1, x0:x1].reshape(-1, 3).astype(np.float32)
r1c = r1w.astype(np.float32).copy()
for c in range(3):
    k, b = np.polyfit(A[:, c], B[:, c], 1); r1c[..., c] = r1c[..., c] * k + b; print("ch", c, round(k, 3), round(b, 1))
o = f0.astype(np.float32) * (1 - a) + r1c * a
cv2.imwrite(out, np.clip(o, 0, 255).astype(np.uint8)); cv2.imwrite(out.replace(".png", "_mask.png"), (a[..., 0] * 255).astype(np.uint8))
print("box", x0, x1, y0, y1, "->", out)
