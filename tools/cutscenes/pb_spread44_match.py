"""v4.4 spread: colour-match a spreadR_v44* layer to the spreadF layer around it (Seedance paper is cooler / darker than the Veo spread,
so the layer's rect showed as a box in the pull-back). One smooth gain field (paper-only ratio spreadF / layer, normalised convolution,
sigma 90 px at 1080) computed on frame 100 and multiplied onto every frame of both sets. Idempotence: run once after pb_spread44_frames.py.
    $OSPY tools/cutscenes/pb_spread44_match.py NAME"""
import sys, os, glob, json, numpy as np, cv2
R = "/home/jade/Documents/vibesong/media/act5/frames/"; name = sys.argv[1]
F = cv2.imread(R + "spreadF/1080/f_00100.jpg").astype(np.float32)
x0 = round((2444 - 21) / 5461 * 1920); y0 = round(722 / 3072 * 1080); h = round(1721 / 3072 * 1080)
f = cv2.resize(F[y0:y0 + h, x0:1920], (1920, 1080), interpolation=cv2.INTER_AREA)
L = cv2.imread(R + f"{name}/1080/f_00100.jpg").astype(np.float32)
lum = lambda a: a.mean(2)
smooth = lambda a: np.abs(lum(a) - cv2.GaussianBlur(lum(a), (0, 0), 3)) < 6
m = (lum(f) > 195) & (lum(L) > 195) & smooth(f) & smooth(L)
yy, xx = np.mgrid[0:1080, 0:1920]
vig = ((xx - 1017) / 760) ** 2 + ((yy - 540) / 520) ** 2 < 1.0          # the drawing itself: never sampled
m &= ~vig
w = m.astype(np.float32); S = 90
num = cv2.GaussianBlur(f * w[..., None], (0, 0), S); den = cv2.GaussianBlur(L * w[..., None], (0, 0), S)
ww = cv2.GaussianBlur(w, (0, 0), S)[..., None]
g_glob = (f[m].mean(0) / L[m].mean(0)).astype(np.float32)
ratio = np.where(ww > 0.05, num / np.maximum(den, 1), g_glob)
k = np.clip((ww - 0.05) / 0.25, 0, 1)                                      # far from paper samples -> global gain
G = (ratio * k + g_glob * (1 - k)).astype(np.float32); G = cv2.GaussianBlur(G, (0, 0), 20)
print("paper samples", int(m.sum()), "global gain (BGR)", g_glob.round(3), "field range", G.min((0, 1)).round(3), G.max((0, 1)).round(3))
for hh, ww_ in [(1080, 1920), (540, 960)]:
    Gs = cv2.resize(G, (ww_, hh), interpolation=cv2.INTER_AREA)
    for p in sorted(glob.glob(R + f"{name}/{hh}/f_*.jpg")):
        a = cv2.imread(p).astype(np.float32); cv2.imwrite(p, np.clip(a * Gs, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
    ix = R + f"{name}/{hh}/index.json"; d = json.load(open(ix)); d["src"] += "; pb_spread44_match.py (paper gain field vs spreadF)"; json.dump(d, open(ix, "w"))
