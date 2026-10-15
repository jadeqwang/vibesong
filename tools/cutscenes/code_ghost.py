"""Procedural 'code showing through the paper': faint mirrored graphite code warped onto the held sheet (never model-drawn text).
    python tools/cutscenes/code_ghost.py IN.png OUT.png x0,y0 x1,y1 x2,y2 x3,y3   (sheet corners TL TR BR BL)"""
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
CODE = ["function draw() {", "  fixtures();   // base", "  functions();  // colour", "  return world;", "}"]
def coeffs(dst, src):   # PIL perspective: maps output (dst) points to input (src) points
    A, B = [], []
    for (x, y), (u, v) in zip(dst, src):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]; B += [u, v]
    return np.linalg.solve(np.array(A, float), np.array(B, float)).tolist()
im = Image.open(sys.argv[1]).convert("RGB"); quad = [tuple(map(float, p.split(","))) for p in sys.argv[3:7]]
SW, SH = 1200, 900
t = Image.new("L", (SW, SH), 0); d = ImageDraw.Draw(t); F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 50)
for i, line in enumerate(CODE):
    d.text((110, 60 + i * 62), line, font=F, fill=255)
t = t.transpose(Image.FLIP_LEFT_RIGHT).filter(ImageFilter.GaussianBlur(1.6))   # seen from the back, through the paper
w = Image.new("L", im.size, 0)
w = t.transform(im.size, Image.PERSPECTIVE, coeffs(quad, [(0, 0), (SW, 0), (SW, SH), (0, SH)]), Image.BICUBIC)
a = np.asarray(w).astype(float)[..., None] / 255 * 0.30
ink = np.array([92, 88, 104], float)
o = np.asarray(im).astype(float); o = o * (1 - a) + (o * ink / 255) * a
Image.fromarray(o.clip(0, 255).astype(np.uint8)).save(sys.argv[2]); print(sys.argv[2])
