"""Zoomed head compare with guide lines (hairline red, brows blue, nose green) + face registration.
    python tools/cutscenes/pb_headcmp.py BASE.png OUT.jpg CROPBOX(x0,y0,x1,y1) GUIDES(y,y,y) EDIT1 [EDIT2 ...]"""
import sys, numpy as np
from PIL import Image, ImageDraw
base, out, box, gy, *eds = sys.argv[1:]
box = [int(v) for v in box.split(',')]; gy = [int(v) for v in gy.split(',')]
a = Image.open(base).convert('RGB'); A = np.asarray(a.convert('L')).astype(float)
ims = [a]
for f in eds:
    b = Image.open(f).convert('RGB').resize(a.size, Image.LANCZOS); B = np.asarray(b.convert('L')).astype(float)
    best = min((np.abs(A[gy[1]:gy[2]+60, :] - np.roll(np.roll(B, dy, 0), dx, 1)[gy[1]:gy[2]+60, :]).mean(), dx, dy) for dy in range(-6, 7) for dx in range(-6, 7))
    print(f, 'face shift', best); ims.append(b)
w, h = box[2]-box[0], box[3]-box[1]; s = 520 / h; W = int(w*s)
S = Image.new('RGB', (W*len(ims), 520), 'white')
for i, im in enumerate(ims):
    c = im.crop(box).resize((W, 520)); d = ImageDraw.Draw(c)
    for y, col in zip(gy, ((255, 0, 0), (0, 0, 255), (0, 160, 0))): d.line((0, (y-box[1])*s, W, (y-box[1])*s), fill=col)
    S.paste(c, (i*W, 0))
S.save(out, quality=92)
