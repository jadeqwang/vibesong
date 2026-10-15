"""Project the MMAH glyph outlines of the Act V world (world5.js GLYPH) through AERIAL_CAM -> 1920x1080 mask.
usage: glyphmask.py OUT.png [W H]   (also: import glyph_mask(W,H) -> uint8 array)"""
import sys, math, numpy as np
sys.path.insert(0, "/home/jade/Documents/vibesong/keyframes/concepts/_work")
import hz
from PIL import Image, ImageDraw, ImageFilter
K, XS, Z, TOP, BOLD = 0.47, [-705, -235, 235, 705], 0.0, 70.0, 1.6
CAM = np.array([0, 1850, 240.]); TGT = np.array([0, 0, -10.]); FOV = 35.0

def project(P, W, H):
    f = TGT - CAM; f /= np.linalg.norm(f); r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r); u = np.cross(r, f)
    d = P - CAM; x, y, z = d @ r, d @ u, d @ f
    t = math.tan(math.radians(FOV / 2))
    sx = (x / z) / (t * W / H); sy = (y / z) / t
    return np.stack([(sx * 0.5 + 0.5) * W, (0.5 - sy * 0.5) * H], -1)

def glyph_mask(W=1920, H=1080, ss=2):
    im = Image.new('L', (W * ss, H * ss), 0); dr = ImageDraw.Draw(im)
    for ch, cx in zip("一笔一画", XS):
        d = hz.load(ch)
        for s in d["strokes"]:
            for poly in hz._flatten(s):
                P = np.array([[cx + (fx - 512) * K, TOP, Z - (fy - 388) * K] for fx, fy in poly])
                q = project(P, W, H) * ss
                dr.polygon([tuple(p) for p in q], fill=255)
    rad = int(round(BOLD * 16 * K * (W / 2074) * ss))  # bold dilation in px (approx scale at the glyph plane)
    im = im.filter(ImageFilter.MaxFilter(2 * rad + 1)) if rad > 0 else im
    return np.asarray(im.resize((W, H), Image.LANCZOS))

if __name__ == "__main__":
    W, H = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (1920, 1080)
    Image.fromarray(glyph_mask(W, H)).save(sys.argv[1]); print("saved", sys.argv[1])
