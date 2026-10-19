"""v4.3 (Jade 10-19): move card 03's pale-blue chest dot from HER RIGHT (image-left) to HER LEFT (image-right, canon).
    $OSPY tools/cutscenes/pb_dotmove.py IN.png OUT.png [SRC_DX SRC_DY] [NEW_CX NEW_CY SQUASH]
1) erase: seamlessClone a same-size jacket patch from (SRC_DX, SRC_DY) offset over the dilated dot mask (keeps pencil grain);
2) add: the ORIGINAL dot's colour as a multiply layer (dot / local jacket colour), squashed horizontally (foreshortened panel)
   and feathered, placed on the image-right front panel. Pixels change only inside the two masks."""
import sys, cv2, numpy as np
a = sys.argv[1:]
src, out = a[0], a[1]
sdx, sdy = (int(a[2]), int(a[3])) if len(a) > 3 else (-70, 0)
ncx, ncy, sq = (float(a[4]), float(a[5]), float(a[6])) if len(a) > 6 else (664, 748, 0.62)
im = cv2.imread(src); h, w = im.shape[:2]
b, g, r = [im[..., i].astype(int) for i in range(3)]
m = np.zeros((h, w), np.uint8); box = (slice(690, 820), slice(380, 510))
m[box] = (((b - r) > 30) & (b > 140))[box].astype(np.uint8) * 255
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
ys, xs = np.where(m > 0); cx, cy = int(xs.mean()), int(ys.mean()); R = int(max(xs.max() - xs.min(), ys.max() - ys.min()) / 2) + 1
# dot multiply layer from the ORIGINAL (soft alpha from blueness)
pad = R + 8
patch = im[cy - pad:cy + pad, cx - pad:cx + pad].astype(np.float32)
ring = np.zeros(patch.shape[:2], np.uint8); cv2.circle(ring, (pad, pad), R + 6, 255, 3)
jacket = np.median(patch[ring > 0], axis=0)
mult = np.clip(patch / jacket, 0, 1.2)
alpha = cv2.GaussianBlur(cv2.dilate(m[cy - pad:cy + pad, cx - pad:cx + pad], np.ones((3, 3), np.uint8)).astype(np.float32) / 255, (5, 5), 1.2)
# 1) erase: copy the cleanest nearby jacket patch (lowest edge energy, colour closest to the ring) with a feathered mask
md = cv2.dilate(m, np.ones((9, 9), np.uint8))
x0, y0, x1, y1 = xs.min() - 10, ys.min() - 10, xs.max() + 11, ys.max() + 11
gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32); edge = np.abs(cv2.Laplacian(cv2.GaussianBlur(gray, (3, 3), 0), cv2.CV_32F))
best = None
for dy in range(-90, 50, 4):
    for dx in range(-110, 0, 4):
        if abs(dx) < (x1 - x0) and abs(dy) < (y1 - y0): continue
        P = im[y0 + dy:y1 + dy, x0 + dx:x1 + dx].astype(np.float32)
        if (b[y0 + dy:y1 + dy, x0 + dx:x1 + dx] - r[y0 + dy:y1 + dy, x0 + dx:x1 + dx]).max() > 20: continue
        sc = edge[y0 + dy:y1 + dy, x0 + dx:x1 + dx].mean() + 0.5 * np.abs(P.reshape(-1, 3).mean(0) - jacket).sum()
        if best is None or sc < best[0]: best = (sc, dx, dy)
if len(a) > 3 and (sdx, sdy) != (0, 0): best = (0, sdx, sdy)
_, sdx, sdy = best
P = im[y0 + sdy:y1 + sdy, x0 + sdx:x1 + sdx].astype(np.float32)
P += jacket - np.median(P.reshape(-1, 3), axis=0)
F = cv2.GaussianBlur(md[y0:y1, x0:x1].astype(np.float32) / 255, (9, 9), 3)[..., None]
er = im.copy(); er[y0:y1, x0:x1] = np.clip(im[y0:y1, x0:x1] * (1 - F) + P * F, 0, 255).astype(np.uint8)
print('erase patch offset', sdx, sdy)
# 2) add squashed dot on the image-right panel
nw = int(round(2 * pad * sq)); M = cv2.resize(mult, (nw, 2 * pad), interpolation=cv2.INTER_AREA)
A = cv2.resize(alpha, (nw, 2 * pad), interpolation=cv2.INTER_AREA)[..., None]
X0, Y0 = int(round(ncx - nw / 2)), int(round(ncy - pad))
reg = er[Y0:Y0 + 2 * pad, X0:X0 + nw].astype(np.float32)
er[Y0:Y0 + 2 * pad, X0:X0 + nw] = np.clip(reg * (1 - A) + reg * M * A, 0, 255).astype(np.uint8)
cv2.imwrite(out, er)
diff = np.abs(er.astype(int) - im.astype(int)).max(2) > 3; yy, xx = np.where(diff)
print(out, 'old dot centre', cx, cy, 'R', R, 'jacket', jacket.round(), 'changed bbox', xx.min(), xx.max(), yy.min(), yy.max(), 'px', diff.sum())
