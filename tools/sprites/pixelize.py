"""Turn AI 'pixel art' crops (upscaled, off-grid) into true low-res pixel sprites.

pixelize(crop_rgba, scale, pal) -> (h, w, 4) uint8 sprite on a true grid, palette-locked, outlined.
Steps: palette-map source pixels; per target cell take a weighted mode (dark outline colours get a boost so
1-px outlines and eyes survive the reduction); coverage threshold for alpha; then cleanup (orphans, holes)
and a consistent 1-px dark outline on the silhouette.
"""
import numpy as np
from PIL import Image
from scipy import ndimage

def lum(c):
    c = np.asarray(c, float); return 0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2]

def build_palette(crops, n=22, alpha_t=200, force=()):
    px = np.concatenate([c[c[..., 3] >= alpha_t][:, :3] for c in crops])
    rng = np.random.default_rng(0)
    if len(px) > 200000: px = px[rng.choice(len(px), 200000, replace=False)]
    strip = Image.fromarray(px.reshape(1, -1, 3).astype(np.uint8))
    q = strip.quantize(colors=n, method=Image.Quantize.MEDIANCUT, kmeans=3)
    pal = np.array(q.getpalette()[: 3 * n]).reshape(-1, 3)
    if len(force):
        pal = np.concatenate([pal[: n - len(force)], np.array(force)]) if n - len(force) > 0 else np.array(force)
        # re-fit the free entries so the forced ones don't leave holes: drop free entries closer than 30 to a forced one
        keep = [i for i, c in enumerate(pal[: n - len(force)]) if min(np.abs(c - np.array(f)).sum() for f in force) > 40]
        pal = np.concatenate([pal[keep], np.array(force)])
    # merge near-duplicates (the AI blacks come in 5 flavours); forced colours (at the end) win
    out = []
    for c in pal[::-1]:
        if all(np.abs(c.astype(int) - o).sum() > 36 for o in out): out.append(c.astype(int))
    return np.array(out[::-1])

def nearest(px, pal):
    d = ((px[:, None, :].astype(int) - pal[None, :, :].astype(int)) ** 2).sum(-1)
    return d.argmin(1)

def pixelize(crop, scale, pal, cover=0.42, dark_boost=1.7, outline="inner", protect=None, anchor="bottom", boost=None,
             fit_phase=False, inner=1.0, min_blob=0):
    h, w = crop.shape[:2]
    H, W = int(np.ceil(h / scale)), int(np.ceil(w / scale))
    oy = (H * scale - h) if anchor == "bottom" else 0          # align the grid to the feet
    ox = (W * scale - w) / 2
    if fit_phase:   # snap our grid to the source's own (approximate) pixel grid
        import gridfit
        _, px, py = gridfit.best_phase(crop[..., :3], crop[..., 3] >= 128, scale, 8)
        ox, oy = -px, -py
        H, W = int(np.ceil((h - py) / scale)), int(np.ceil((w - px) / scale))
    idx = nearest(crop[..., :3].reshape(-1, 3), pal).reshape(h, w)
    opq = crop[..., 3] >= 128
    L = lum(pal); weight = np.where(L < 55, dark_boost, 1.0)
    if boost is not None:
        for i, c in enumerate(pal):
            if protect is not None and protect(c): weight[i] = boost
    out_i = np.full((H, W), -1, int)
    m_ = (1 - inner) / 2 * scale
    for ty in range(H):
        fy0 = ty * scale - oy; fy1 = fy0 + scale
        y0, y1 = max(int(round(fy0)), 0), min(int(round(fy1)), h)
        iy0, iy1 = max(int(round(fy0 + m_)), 0), min(int(round(fy1 - m_)), h)
        for tx in range(W):
            fx0 = tx * scale - ox; fx1 = fx0 + scale
            x0, x1 = max(int(round(fx0)), 0), min(int(round(fx1)), w)
            ix0, ix1 = max(int(round(fx0 + m_)), 0), min(int(round(fx1 - m_)), w)
            if y1 <= y0 or x1 <= x0: continue
            if opq[y0:y1, x0:x1].mean() < cover: continue
            if iy1 <= iy0 or ix1 <= ix0: iy0, iy1, ix0, ix1 = y0, y1, x0, x1
            o = opq[iy0:iy1, ix0:ix1]
            if not o.any(): iy0, iy1, ix0, ix1 = y0, y1, x0, x1; o = opq[y0:y1, x0:x1]
            v = idx[iy0:iy1, ix0:ix1][o]
            cnt = np.bincount(v, minlength=len(pal)) * weight
            out_i[ty, tx] = cnt.argmax()
    out_i = cleanup(out_i, pal)
    if min_blob:   # drop tiny detached specks (stray pixels from AI noise)
        lab, n = ndimage.label(out_i >= 0, structure=np.ones((3, 3)))
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        for k, sz in enumerate(sizes):
            if sz <= min_blob: out_i[lab == k + 1] = -1
    if outline: out_i = add_outline(out_i, pal, protect, outline)
    rgba = np.zeros((H, W, 4), np.uint8)
    m = out_i >= 0
    rgba[m, :3] = pal[out_i[m]]; rgba[m, 3] = 255
    return rgba

def cleanup(ix, pal):
    m = ix >= 0
    # orphan opaque pixels (<=1 opaque 8-neighbour) -> transparent
    nb = ndimage.convolve(m.astype(int), np.ones((3, 3), int), mode="constant") - m
    ix = np.where(m & (nb <= 1), -1, ix); m = ix >= 0
    # pinholes: transparent with >=7 opaque neighbours -> fill with neighbour mode
    nb = ndimage.convolve(m.astype(int), np.ones((3, 3), int), mode="constant") - m
    for y, x in zip(*np.nonzero(~m & (nb >= 7))):
        v = ix[max(y - 1, 0):y + 2, max(x - 1, 0):x + 2].ravel(); v = v[v >= 0]
        ix[y, x] = np.bincount(v).argmax()
    # lone interior pixel whose colour differs from all 4 neighbours (and all 4 agree) -> neighbour colour
    H, W = ix.shape; L = lum(pal)
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            c = ix[y, x]
            if c < 0: continue
            n4 = [ix[y - 1, x], ix[y + 1, x], ix[y, x - 1], ix[y, x + 1]]
            if min(n4) >= 0 and len(set(n4)) == 1 and n4[0] != c and L[c] >= 55:
                ix[y, x] = n4[0]
    return ix

def add_outline(ix, pal, protect=None, mode="inner"):
    """Silhouette pixels (4-adjacent to transparency) become the outline colour, except protected hues
    (e.g. pencil blue/orange) which keep their colour so thin props stay readable."""
    L = lum(pal); ol = int(L.argmin())
    m = ix >= 0
    if mode == "outer":
        dil = ndimage.binary_dilation(m, structure=[[0, 1, 0], [1, 1, 1], [0, 1, 0]])
        ix = ix.copy(); ix[dil & ~m] = ol
        return ix
    er = ndimage.binary_erosion(m, structure=[[0, 1, 0], [1, 1, 1], [0, 1, 0]], border_value=0)
    edge = m & ~er
    prot = np.zeros(len(pal), bool)
    if protect is not None:
        for i, c in enumerate(pal):
            prot[i] = protect(c)
    ix = ix.copy()
    for y, x in zip(*np.nonzero(edge)):
        c = ix[y, x]
        if prot[c]: continue
        ix[y, x] = ol
    return ix
