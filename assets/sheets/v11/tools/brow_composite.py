#!/usr/bin/env python3
"""v11 brows: composite model-drawn brows (nano-banana-pro edit, candidate A strength) back onto the approved v3 paper art,
ONLY inside tight feathered brow masks. No brow is drawn by code: every brow pixel comes from the model's illustration.

mask per brow = ellipse(box padded) ∩ dilate(dark(src) | dark(base)), feathered (gaussian). Before pasting, src is
registered to base inside a face window by an integer+subpixel shift search (the model re-renders the whole sheet).
Run: .venv/bin/python assets/sheets/v11/tools/brow_composite.py
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
J = lambda *p: os.path.join(ROOT, *p)


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def register(base, src, win, rng=3):
    """best (dy,dx) integer shift of src within +-rng that matches base inside win (x0,y0,x1,y1)."""
    x0, y0, x1, y1 = win
    B = lum(base[y0:y1, x0:x1]); best = None
    for dy in range(-rng, rng + 1):
        for dx in range(-rng, rng + 1):
            Sv = lum(src[y0 - dy:y1 - dy, x0 - dx:x1 - dx])
            e = np.abs(B - Sv).mean()
            if best is None or e < best[0]:
                best = (e, dy, dx)
    return best[1], best[2], best[0]


def brow_mask(base, src, box, pad=5, feather=2.0, drop=38):
    H, W = base.shape[:2]
    x0, y0, x1, y1 = box
    x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)
    m = np.zeros((H, W), np.float32)
    lb, ls = lum(base[y0:y1, x0:x1]), lum(src[y0:y1, x0:x1])
    skin = np.percentile(np.concatenate([lb.ravel(), ls.ravel()]), 85)
    dark = (lb < skin - drop) | (ls < skin - drop)
    dark = ndimage.binary_dilation(dark, iterations=2)
    yy, xx = np.mgrid[y0:y1, x0:x1]
    cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2
    ell = np.abs((xx - cx) / rx) ** 4 + np.abs((yy - cy) / ry) ** 4 <= 1.0   # superellipse: keeps brow tails in the corners
    m[y0:y1, x0:x1] = (dark & ell).astype(np.float32)
    return m


def run(job):
    base = np.asarray(Image.open(J(job['base'])).convert('RGB'), np.float32)
    srcim = Image.open(J(job['src'])).convert('RGB')
    if 'src_place' in job:   # src is an edit of a crop of base: resize back and place at (x,y,w,h)
        x, y, w, h = job['src_place']
        full = Image.fromarray(base.astype(np.uint8)); full.paste(srcim.resize((w, h), Image.LANCZOS), (x, y)); srcim = full
    elif 'src_crop' in job:  # src is a bigger sheet; base is a crop of it at (x,y)
        x, y = job['src_crop']; srcim = srcim.crop((x, y, x + base.shape[1], y + base.shape[0]))
    if srcim.size != (base.shape[1], base.shape[0]):
        srcim = srcim.resize((base.shape[1], base.shape[0]), Image.LANCZOS)
    src = np.asarray(srcim, np.float32)
    M = np.zeros(base.shape[:2], np.float32); log = []
    for face in job['faces']:
        win = face['win']
        dy, dx, e = register(base, src, win) if job.get('register', True) else (0, 0, 0)
        s = np.roll(src, (dy, dx), axis=(0, 1))
        fm = np.zeros_like(M)
        for b in face['brows']:
            if len(b) == 6 and b[4] == 'ell':   # explicit ellipse cx,cy,rx,ry (v10 method)
                cx, cy, rx, ry = b[0], b[1], b[2], b[3]
                yy, xx = np.mgrid[0:M.shape[0], 0:M.shape[1]]
                fm = np.maximum(fm, ((((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2) <= 1).astype(np.float32))
            else:
                fm = np.maximum(fm, brow_mask(base, s, b, pad=job.get('pad', 5), drop=job.get('drop', 38)))
        fm = ndimage.gaussian_filter(fm, job.get('feather', 2.0))
        src_f = s
        base = base * (1 - fm[..., None]) + src_f * fm[..., None]
        M = np.maximum(M, fm)
        log.append({'win': win, 'shift': [int(dy), int(dx)], 'err': round(float(e), 2)})
    out = J(job['out']); os.makedirs(os.path.dirname(out), exist_ok=True)
    im = Image.fromarray(np.clip(base + 0.5, 0, 255).astype(np.uint8))
    if out.endswith('.jpg'):
        im.save(out, quality=95)
    else:
        im.save(out)
    if job.get('mask_out'):
        Image.fromarray((M * 255).astype(np.uint8)).save(J(job['mask_out']))
    print(job['out'], log)


if __name__ == '__main__':
    spec = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'brow_jobs.json')))
    for j in spec:
        if not sys.argv[2:] or j['out'] in sys.argv[2:] or any(k in j['out'] for k in sys.argv[2:]):
            run(j)
