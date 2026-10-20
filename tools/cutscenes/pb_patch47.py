"""v4.7 (unit v47_cards): card 06 sleeve patch = the round b/w 1420 MHz patch centred ON the orange band of her LEFT upper arm (image right).
    .venv/bin/python tools/cutscenes/pb_patch47.py SRC.png ERASED_ZOOM.png OUT.png CX CY R [ROT_DEG SQUASH]
SRC = the approved 06 still (1920x1080); ERASED_ZOOM = nano-banana edit of SRC[520:880, 540:900] x3 with the old patch removed;
the patch pixels are card 04's own drawn patch (ff04_v2.jpg, ellipse c 1316,852 rx 42 ry 58), unsquashed to a disc, scaled to R,
squashed by SQUASH across the arm and rotated ROT_DEG (PIL sense), pasted at CX,CY (full-frame px) under a 2 px feathered ellipse."""
import sys, numpy as np
from PIL import Image, ImageFilter, ImageDraw
src, ez, out, cx, cy, R = sys.argv[1], sys.argv[2], sys.argv[3], *map(float, sys.argv[4:7])
rot = float(sys.argv[7]) if len(sys.argv) > 7 else -20; sq = float(sys.argv[8]) if len(sys.argv) > 8 else 0.88
X0, Y0, Z = 520, 540, 360
S = Image.open(src).convert("RGB"); E = Image.open(ez).convert("RGB").resize((Z, Z), Image.LANCZOS)
# 1) erased sleeve back in, feathered, only around the old patch (Hough c 739.5,696.5 r 37)
m = Image.new("L", (Z, Z), 0); ImageDraw.Draw(m).ellipse((739.5 - X0 - 56, 696.5 - Y0 - 56, 739.5 - X0 + 56, 696.5 - Y0 + 56), fill=255)
m = m.filter(ImageFilter.GaussianBlur(8)); reg = S.crop((X0, Y0, X0 + Z, Y0 + Z)); reg = Image.composite(E, reg, m); S.paste(reg, (X0, Y0))
# 2) card 04's patch as a disc
P4 = Image.open("media/cutscenes/_work/passB/v43/ff04_v2.jpg").convert("RGB")
k = 4; pc = P4.crop((1316 - 46, 852 - 62, 1316 + 46, 852 + 62)).resize((int(92 * 58 / 42 * k), 124 * k), Image.LANCZOS)   # unsquash x
pm = Image.new("L", pc.size, 0); w, h = pc.size; ImageDraw.Draw(pm).ellipse((w / 2 - 58 * k, h / 2 - 58 * k, w / 2 + 58 * k, h / 2 + 58 * k), fill=255)
pc.putalpha(pm); s = R / 58.0
pc = pc.resize((max(1, int(w * s * sq / k)), max(1, int(h * s / k))), Image.LANCZOS).rotate(rot, Image.BICUBIC, expand=True)
a = pc.split()[3].filter(ImageFilter.GaussianBlur(0.8)); pc.putalpha(a)
S.paste(pc, (int(round(cx - pc.width / 2)), int(round(cy - pc.height / 2))), pc)
S.save(out); print(out)
