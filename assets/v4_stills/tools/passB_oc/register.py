#!/usr/bin/env python3
"""Find the similarity (scale + translation) that maps image B's drawing onto image A (graphite line maps, FFT NCC
per scale). usage: register.py A B [smin smax steps] [roiB x0 y0 x1 y1 (B px)] -> prints best (s, dx, dy): A = s*B + d"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage

def lines(p, w):
    im = Image.open(p).convert('L'); k = w / im.width
    a = np.asarray(im.resize((w, round(im.height * k)), Image.LANCZOS), np.float32)
    d = np.clip(ndimage.gaussian_filter(a, 6) - a, 0, None)        # dark lines vs local paper
    return ndimage.gaussian_filter(d, 1.0), k

def ncc_shift(A, T):
    """best placement of template T inside A (zero-mean, normalised by template energy)"""
    H, W = A.shape; h, w = T.shape
    Tz = (T - T.mean()) / (T.std() + 1e-6)
    P = np.zeros_like(A); P[:h, :w] = Tz
    r = np.fft.ifft2(np.fft.fft2(A) * np.conj(np.fft.fft2(P))).real
    # local std of A for normalisation
    S1 = ndimage.uniform_filter(A, (h, w), mode='constant', origin=(-(h // 2), -(w // 2)))
    S2 = ndimage.uniform_filter(A * A, (h, w), mode='constant', origin=(-(h // 2), -(w // 2)))
    sd = np.sqrt(np.clip(S2 - S1 * S1, 1e-6, None)) * h * w
    r = r / sd; r[H - h + 1:, :] = -1; r[:, W - w + 1:] = -1
    y, x = np.unravel_index(r.argmax(), r.shape); return r.max(), x, y

if __name__ == '__main__':
    pa, pb = sys.argv[1], sys.argv[2]
    smin, smax, n = (float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (0.5, 1.5, 21)
    roi = list(map(int, sys.argv[6:10])) if len(sys.argv) > 9 else None
    WA = 900
    A, ka = lines(pa, WA)
    Bim = Image.open(pb)
    best = None
    for s in np.linspace(smin, smax, n):
        wb = max(32, round(Bim.width * ka * s))
        B, kb = lines(pb, wb)
        x0 = y0 = 0
        if roi: x0, y0, x1, y1 = [round(v * kb) for v in roi]; B = B[y0:y1, x0:x1]
        if B.shape[0] >= A.shape[0] or B.shape[1] >= A.shape[1]: continue
        sc, x, y = ncc_shift(A, B)
        if best is None or sc > best[0]: best = (sc, s, (x - x0) / ka, (y - y0) / ka)
        print(f's={s:.3f} ncc={sc:.3f} at A px ({(x - x0) / ka:.1f}, {(y - y0) / ka:.1f})', flush=True)
    sc, s, dx, dy = best
    # in A pixel units: A = s * (B px * Bscale) ... report as A = S*B + D with S in pixel ratio
    S = Image.open(pb).width and (ka * s) / ka * (1)  # = s * (Bim.width*ka*s / Bim.width) / ka
    S = round(Bim.width * ka * s) / Bim.width / ka
    print(f'BEST ncc={sc:.3f}  A = {S:.5f} * B + ({dx:.1f}, {dy:.1f})')
