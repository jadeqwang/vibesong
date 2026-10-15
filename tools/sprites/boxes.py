"""List sprite components (alpha blobs grouped by dilation) of a transparent sheet; write an index overlay."""
import sys, json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

def components(path, alpha_t=230, grow=3, min_area=400, bg=None):
    im = np.array(Image.open(path).convert("RGBA"))
    if bg is not None:   # opaque sheet on a flat bg colour: build alpha from distance to bg
        d = np.abs(im[..., :3].astype(int) - np.array(bg)).sum(-1)
        im[..., 3] = np.where(d > 60, 255, 0)
    m = im[..., 3] >= alpha_t
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=grow))
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        sub = m[y0:y1, x0:x1] & (lab[y0:y1, x0:x1] == i + 1)
        if sub.sum() < min_area: continue
        ys, xs = np.nonzero(sub)
        out.append([int(x0 + xs.min()), int(y0 + ys.min()), int(x0 + xs.max() + 1), int(y0 + ys.max() + 1)])
    # sort into rows by vertical centre
    out.sort(key=lambda b: ((b[1] + b[3]) / 2, b[0]))
    rows = []
    for b in out:
        cy = (b[1] + b[3]) / 2
        if rows and abs(cy - rows[-1][-1][4]) < 70: rows[-1].append(b + [cy])
        else: rows.append([b + [cy]])
    res = []
    for r in rows:
        r.sort(key=lambda b: b[0]); res += [b[:4] for b in r]
    return im, res

if __name__ == "__main__":
    path, ov = sys.argv[1], sys.argv[2]
    bg = json.loads(sys.argv[3]) if len(sys.argv) > 3 else None
    im, bx = components(path, bg=bg)
    vis = Image.new("RGBA", im.shape[1::-1], (90, 90, 90, 255)); vis.alpha_composite(Image.fromarray(im))
    d = ImageDraw.Draw(vis)
    for i, b in enumerate(bx):
        d.rectangle(b, outline=(255, 0, 255, 255), width=2); d.text((b[0] + 3, b[1] + 3), str(i), fill=(255, 255, 0, 255))
        print(i, b, b[2] - b[0], b[3] - b[1])
    vis.convert("RGB").save(ov)
