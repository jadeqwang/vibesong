"""v4.5 v45_ricky: paste an NBP Ricky edit (of the crop x1488-2528 y200-1500 of still_b1g1) back into the still, Ricky-only mask
(Jade's sleeve/cuff/hand/strap excluded), ECC-aligned. -> media/act5/_work/v45/still_<tag>.png (+ _mask.png, _diff.jpg)
    $OSPY tools/cutscenes/pb_spread45_ricky.py EDIT.png TAG"""
import sys, numpy as np, cv2
W = "/home/jade/Documents/vibesong/media/act5/_work/v45/"
edit, tag = sys.argv[1], sys.argv[2]
X0, Y0, CW, CH = 1488, 200, 1040, 1300
still = cv2.imread("/home/jade/Documents/vibesong/media/act5/_work/v44/still_b1g1.png")
o = still[Y0:Y0 + CH, X0:X0 + CW].copy()
e = cv2.resize(cv2.imread(edit), (CW, CH), interpolation=cv2.INTER_AREA)
g = lambda a: cv2.cvtColor(a, cv2.COLOR_BGR2GRAY).astype(np.float32)
warp = np.eye(2, 3, dtype=np.float32)
cc, warp = cv2.findTransformECC(g(o), g(e), warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), None, 5)
e = cv2.warpAffine(e, warp, (CW, CH), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
print("ecc", round(cc, 4), warp.round(4).tolist())
RICKY = [(160, 440), (300, 400), (300, 60), (660, 60), (660, 420), (720, 560), (840, 620), (1035, 610), (1035, 790), (820, 820), (810, 920),
         (660, 970), (650, 1040), (300, 1060), (120, 1060), (60, 900), (60, 600), (90, 520)]
JADE = [(0, 430), (75, 440), (94, 600), (94, 750), (102, 830), (116, 900), (140, 990), (152, 1040), (160, 1060), (300, 1070), (310, 1300), (0, 1300)]
m = np.zeros((CH, CW), np.uint8); cv2.fillPoly(m, [np.array(RICKY, np.int32)], 255)
j = np.zeros((CH, CW), np.uint8); cv2.fillPoly(j, [np.array(JADE, np.int32)], 255)
m = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 6)
jm = cv2.GaussianBlur(cv2.erode(j, np.ones((5, 5), np.uint8)).astype(np.float32) / 255, (0, 0), 2)
a = (m * (1 - jm))[..., None]
# match the edit's overall tone to the original on the unchanged background (outside the Ricky mask)
bg = (m < 0.02) & (jm < 0.02)
gain = (o[bg].astype(np.float32).mean(0) / np.maximum(e[bg].astype(np.float32).mean(0), 1)); print("gain", gain.round(3))
e = np.clip(e.astype(np.float32) * gain, 0, 255)
out = still.copy().astype(np.float32)
out[Y0:Y0 + CH, X0:X0 + CW] = o * (1 - a) + e * a
cv2.imwrite(W + f"still_{tag}.png", np.clip(out, 0, 255).astype(np.uint8))
cv2.imwrite(W + f"still_{tag}_mask.png", (a[..., 0] * 255).astype(np.uint8))
d = np.abs(e - o).mean(2); d[a[..., 0] > 0.5] = 0
cv2.imwrite(W + f"still_{tag}_diff_outside.jpg", np.clip(d * 3, 0, 255).astype(np.uint8))
print("wrote", W + f"still_{tag}.png")
