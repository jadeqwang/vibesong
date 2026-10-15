"""Fit the AI image's (approximate) native pixel grid: find scale s and phase (px, py) that make cells most uniform."""
import numpy as np

def cell_cost(rgb, opq, s, px, py):
    h, w = opq.shape
    cy = np.floor((np.arange(h) - py) / s).astype(int); cx = np.floor((np.arange(w) - px) / s).astype(int)
    cy -= cy.min(); cx -= cx.min()
    cid = (cy[:, None] * (cx.max() + 1) + cx[None, :])[opq]
    v = rgb[opq].astype(float)
    n = np.bincount(cid)
    cost = 0.0
    for k in range(3):
        sm = np.bincount(cid, v[:, k]); sq = np.bincount(cid, v[:, k] ** 2)
        cost += (sq - sm ** 2 / np.maximum(n, 1)).sum()
    return cost / max(opq.sum(), 1)

def best_phase(rgb, opq, s, steps=6):
    best = (1e18, 0, 0)
    for px in np.linspace(0, s, steps, endpoint=False):
        for py in np.linspace(0, s, steps, endpoint=False):
            c = cell_cost(rgb, opq, s, px, py)
            if c < best[0]: best = (c, px, py)
    return best

def fit_scale(crops, smin, smax, n=25):
    res = []
    for s in np.linspace(smin, smax, n):
        tot = 0
        for c in crops:
            tot += best_phase(c[..., :3], c[..., 3] >= 128, s, 4)[0]
        # penalise large cells a little (bigger cells always look 'less uniform', smaller ones overfit)
        res.append((tot / len(crops), s))
    return res
