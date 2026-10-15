"""Estimate the native pixel-art grid (period + phase) of an upscaled AI 'pixel art' image."""
import numpy as np
from PIL import Image

def edges(rgb, alpha, axis):
    d = np.abs(np.diff(rgb.astype(int), axis=axis)).sum(-1)
    a = np.minimum(np.take(alpha, range(alpha.shape[axis] - 1), axis=axis), np.take(alpha, range(1, alpha.shape[axis]), axis=axis))
    return (d > 60) & (a > 128)

def period(rgb, alpha, axis, ps=np.arange(2.5, 9.0, 0.01)):
    e = edges(rgb, alpha, axis)
    pos = np.nonzero(e)[axis].astype(float) + 0.5   # boundary between pixel i and i+1 is at i+1
    best = []
    for p in ps:
        z = np.exp(2j * np.pi * pos / p).mean()
        best.append((abs(z), p, (np.angle(z) / (2 * np.pi) * p) % p))
    best.sort(reverse=True)
    return best[:5]

if __name__ == "__main__":
    import sys
    im = np.array(Image.open(sys.argv[1]).convert("RGBA"))
    if len(sys.argv) > 2:
        x0, y0, x1, y1 = map(int, sys.argv[2].split(","))
        im = im[y0:y1, x0:x1]
    for ax, nm in ((1, "x"), (0, "y")):
        print(nm, [(round(s, 3), round(p, 2), round(ph, 2)) for s, p, ph in period(im[..., :3], im[..., 3], ax)])
