"""v4.7 v47_outro: before/after crops (v46r2b vs v47 frames + the end page) for review.
    $OSPY tools/cutscenes/pb_spread47_ab.py OUTDIR"""
import sys, os, cv2, numpy as np
R = "/home/jade/Documents/vibesong/media/act5/"; out = sys.argv[1]; os.makedirs(out, exist_ok=True)
D = R + "frames/%s/1080/f_%05d.jpg"
def lab(im, t):
    cv2.rectangle(im, (0, 0), (len(t) * 9 + 8, 20), (255, 255, 255), -1); cv2.putText(im, t, (4, 15), 0, 0.5, (30, 30, 30), 1, cv2.LINE_AA); return im
def pair(a, b, box, s, ta, tb):
    x0, y0, x1, y1 = box; z = lambda q: cv2.resize(q[y0:y1, x0:x1], None, fx=s, fy=s, interpolation=cv2.INTER_CUBIC)
    A, B = lab(z(a), ta), lab(z(b), tb); return np.hstack([A, np.full((A.shape[0], 8, 3), 255, np.uint8), B])
for t in (187.00, 188.40, 190.00, 191.30, 193.00):
    k = round((t - 186.30) * 30)
    a, b = cv2.imread(D % ('spreadR_v46r2b', k)), cv2.imread(D % ('spreadR_v47', k))
    tag = f"{t:.2f}"
    cv2.imwrite(f"{out}/ab_{tag}_jacket_1.5x.jpg", pair(a, b, (820, 330, 1290, 820), 1.5, f"v4.6 {tag}", f"v4.7 {tag}"), [cv2.IMWRITE_JPEG_QUALITY, 92])
    cv2.imwrite(f"{out}/ab_{tag}_patch_4x.jpg", pair(a, b, (1100, 480, 1200, 580), 4, f"v4.6 {tag}", f"v4.7 {tag}"), [cv2.IMWRITE_JPEG_QUALITY, 92])
    cv2.imwrite(f"{out}/ab_{tag}_shoulders_3x.jpg", pair(a, b, (870, 370, 1160, 470), 3, f"v4.6 {tag}", f"v4.7 {tag}"), [cv2.IMWRITE_JPEG_QUALITY, 92])
    cv2.imwrite(f"{out}/ab_{tag}_hem_2x.jpg", pair(a, b, (880, 540, 1150, 680), 2, f"v4.6 {tag} hem", f"v4.7 {tag} hem"), [cv2.IMWRITE_JPEG_QUALITY, 92])
    cv2.imwrite(f"{out}/ab_{tag}_cuffs_2x.jpg", pair(a, b, (760, 690, 1250, 800), 2, f"v4.6 {tag} cuffs", f"v4.7 {tag} cuffs"), [cv2.IMWRITE_JPEG_QUALITY, 92])
a, b = cv2.imread(R + "tex/page11_v46.jpg"), cv2.imread(R + "tex/page11.jpg")
cv2.imwrite(f"{out}/ab_endpage11_jacket_3x.jpg", pair(a, b, (900, 560, 1110, 700), 3, "v4.6 end page (195.4+)", "v4.7 end page"), [cv2.IMWRITE_JPEG_QUALITY, 92])
