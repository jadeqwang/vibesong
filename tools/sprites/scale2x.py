"""Scale2x/EPX for RGBA pixel art: doubles resolution with clean diagonals and no new colours.
Usage: scale2x.py NAME... (reads assets/sprites/NAME.png, writes NAME_x2.png and registers it in sprites.json)"""
import sys, json
import numpy as np
from PIL import Image
R = "/home/jade/Documents/vibesong/assets/sprites/"

def scale2x(a):
    h, w = a.shape[:2]
    p = np.pad(a, ((1, 1), (1, 1), (0, 0)), mode="edge")
    P = p[1:-1, 1:-1]; A = p[:-2, 1:-1]; B = p[1:-1, 2:]; C = p[1:-1, :-2]; D = p[2:, 1:-1]
    eq = lambda x, y: (x == y).all(-1)
    out = np.zeros((h * 2, w * 2, a.shape[2]), a.dtype)
    c1 = np.where((eq(C, A) & ~eq(C, D) & ~eq(A, B))[..., None], A, P)
    c2 = np.where((eq(A, B) & ~eq(A, C) & ~eq(B, D))[..., None], B, P)
    c3 = np.where((eq(D, C) & ~eq(D, B) & ~eq(C, A))[..., None], C, P)
    c4 = np.where((eq(B, D) & ~eq(B, A) & ~eq(D, C))[..., None], D, P)
    out[0::2, 0::2] = c1; out[0::2, 1::2] = c2; out[1::2, 0::2] = c3; out[1::2, 1::2] = c4
    return out

def thin_outline(a):
    """After 2x, the silhouette outline is 2 px thick; keep the outer px, give the inner px the interior colour."""
    from scipy import ndimage
    op = a[..., 3] > 0
    lumv = a[..., :3].astype(int).sum(-1)
    dark = op & (lumv < 90)
    k4 = [[0, 1, 0], [1, 1, 1], [0, 1, 0]]
    ring1 = op & ~ndimage.binary_erosion(op, k4, border_value=0)
    ring2 = ndimage.binary_erosion(op, k4, border_value=0) & ~ndimage.binary_erosion(op, k4, iterations=2, border_value=0)
    out = a.copy(); H, W = op.shape
    for y, x in zip(*np.nonzero(ring2 & dark)):
        cand = [(y + dy, x + dx) for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)) if 0 <= y + dy < H and 0 <= x + dx < W]
        inner = [a[p] for p in cand if op[p] and not dark[p] and not ring1[p]]
        if inner:
            out[y, x] = inner[0]
    return out

if __name__ == "__main__":
    meta = json.load(open(R + "sprites.json"))
    for n in sys.argv[1:]:
        a = np.array(Image.open(R + n + ".png").convert("RGBA"))
        a[a[..., 3] == 0] = 0
        Image.fromarray(thin_outline(scale2x(a))).save(R + n + "_x2.png")
        m = dict(meta["sprites"][n]); m.update(file=n + "_x2.png", frame_w=m["frame_w"] * 2, frame_h=m["frame_h"] * 2,
                                               anchor=[m["anchor"][0] * 2, m["anchor"][1] * 2 + 1],
                                               note=(m.get("note", "") + " | Scale2x of " + n + ".png: same palette, 2x game-pixel density for a screen-filling boss").strip(" |"))
        meta["sprites"][n + "_x2"] = m
        print(n, "->", n + "_x2.png", a.shape[1::-1], "->", (a.shape[1] * 2, a.shape[0] * 2))
    json.dump(meta, open(R + "sprites.json", "w"), indent=1)
