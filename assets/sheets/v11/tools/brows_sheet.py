#!/usr/bin/env python3
"""before/after sheet for the v11 brows (2x face crops) -> engine/out/review/v4_stills/brows_v11_sheet.jpg"""
import os
from PIL import Image, ImageDraw, ImageFont
R = '/home/jade/Documents/vibesong/'
F = ImageFont.truetype(R + 'engine/assets/fonts/Inter.ttf', 22)
FB = ImageFont.truetype(R + 'engine/assets/fonts/Inter.ttf', 34)
A = R + 'engine/src/scenes/act4/assets/'; V = R + 'assets/sheets/v11/'; O3 = R + 'assets/sheets/paper/old_v3/'
# (label, before, after, box, scale)
ROWS = [
 ('turn · front', O3 + 'paper_jade_turnaround.png', V + 'paper_jade_turnaround_v11.png', (300, 140, 480, 260), 2),
 ('turn · 3/4', O3 + 'paper_jade_turnaround.png', V + 'paper_jade_turnaround_v11.png', (910, 140, 1090, 260), 2),
 ('turn · profile', O3 + 'paper_jade_turnaround.png', V + 'paper_jade_turnaround_v11.png', (1530, 140, 1710, 260), 2),
 ('lineup (sheet + act4 lineup.jpg)', O3 + 'paper_lineup.png', V + 'paper_lineup_v11.png', (450, 170, 670, 320), 2),
 ('expr 1 · neutral', O3 + 'paper_expr_jade.png', V + 'paper_expr_jade_v11.png', (330, 230, 670, 470), 1),
 ('expr 2 · smile', O3 + 'paper_expr_jade.png', V + 'paper_expr_jade_v11.png', (1130, 230, 1470, 470), 1),
 ('expr 3 · sing soft', O3 + 'paper_expr_jade.png', V + 'paper_expr_jade_v11.png', (2030, 210, 2370, 450), 1),
 ('expr 4 · sing open', O3 + 'paper_expr_jade.png', V + 'paper_expr_jade_v11.png', (250, 990, 590, 1230), 1),
 ('expr 5 · laugh', O3 + 'paper_expr_jade.png', V + 'paper_expr_jade_v11.png', (1130, 990, 1470, 1230), 1),
 ('expr 6 · determined', O3 + 'paper_expr_jade.png', V + 'paper_expr_jade_v11.png', (1990, 1010, 2330, 1250), 1),
 ('bridge jade_sing_a (v3.0 -> v11)', A + 'jade_sing_a.jpg', V + 'jade_sing_a_v11.jpg', (150, 200, 490, 440), 1),
 ('bridge jade_sing_b', A + 'jade_sing_b.jpg', V + 'jade_sing_b_v11.jpg', (70, 230, 410, 470), 1),
 ('bridge jade_laugh', A + 'jade_laugh.jpg', V + 'jade_laugh_v11.jpg', (20, 210, 360, 450), 1),
 ('outro spread · right page', R + 'media/act5/gen/spread_v2.png', V + 'spread_v2_v11.png', (3950, 1150, 4190, 1330), 1.42),
]
cells = []
for lab, b, a, box, s in ROWS:
    ims = []
    for p in (b, a):
        c = Image.open(p).convert('RGB').crop(box); ims.append(c.resize((int(c.width * s * 1.0), int(c.height * s * 1.0)), Image.LANCZOS))
    w = ims[0].width * 2 + 12; h = ims[0].height + 36
    cell = Image.new('RGB', (w, h), (246, 242, 234)); d = ImageDraw.Draw(cell)
    d.text((4, 4), lab, font=F, fill=(40, 40, 40))
    cell.paste(ims[0], (0, 36)); cell.paste(ims[1], (ims[0].width + 12, 36))
    d.text((6, 40), 'before', font=F, fill=(200, 40, 40)); d.text((ims[0].width + 18, 40), 'v11', font=F, fill=(20, 120, 40))
    cells.append(cell)
COLS = 2; GAP = 24
rows = [cells[i:i + COLS] for i in range(0, len(cells), COLS)]
W = max(sum(c.width for c in r) + GAP * (len(r) + 1) for r in rows); H = 70 + sum(max(c.height for c in r) + GAP for r in rows)
out = Image.new('RGB', (W, H), (255, 255, 255)); d = ImageDraw.Draw(out)
d.text((GAP, 18), 'Paper brows v11 = candidate A (v3 + ~25%), model-drawn, composited in feathered brow masks only', font=FB, fill=(20, 20, 20))
y = 70
for r in rows:
    x = GAP
    for c in r:
        out.paste(c, (x, y)); x += c.width + GAP
    y += max(c.height for c in r) + GAP
os.makedirs(R + 'engine/out/review/v4_stills', exist_ok=True)
out.save(R + 'engine/out/review/v4_stills/brows_v11_sheet.jpg', quality=90); print(out.size)
