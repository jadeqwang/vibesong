#!/usr/bin/env python3
"""labelled contact sheet of the 11 Tier-2 stills -> engine/out/review/v4_stills/stills_sheet.jpg"""
from PIL import Image, ImageDraw, ImageFont
R = '/home/jade/Documents/vibesong/'; S = R + 'assets/v4_stills/'
F = ImageFont.truetype(R + 'engine/assets/fonts/LXGWWenKai-Medium.ttf', 23); FB = ImageFont.truetype(R + 'engine/assets/fonts/Inter.ttf', 26)
FB.set_variation_by_axes([32, 700]); FT = ImageFont.truetype(R + 'engine/assets/fonts/Inter.ttf', 40); FT.set_variation_by_axes([32, 700])
ITEMS = [
 ('01_sketchbook_2011.png', '01 · 0:00–0:04', "The 2011 page: Charlie alone, graphite only. Slate in hand. The pencil lands and slashes 一 (becomes Level 1's floor)."),
 ('02_save_file_continue.png', '02 · 0:07.18 (808 hit)', 'SAVE FILE FOUND · 2011 · CONTINUE? full size; Jade presses CONTINUE on the hit (v3 select-screen look).'),
 ('03_paper_0020.png', '03 · 0:20', '"my imagination is linked to my everyday life": everyday objects on a blue link-chain. Paper close-up, v11 brows.'),
 ('04_paper_0048.png', '04 · 0:48', '"I just ask myself what it is that I need?": the prompt window reflected in her eyes, blueprint grid.'),
 ('05_paper_0147.png', '05 · 1:47', '世界 是我的舞台: three paper spotlights, one per band member; Jade sings front-on.'),
 ('06_paper_0223.png', '06 · 2:23', '"I just ask myself…": Jade faces the Eraser, holding out the rainbow pencil (hair down).'),
 ('07_flood_full_frame.png', '07 · 1:59.0–2:03.3', 'THE flood: no UI, Jade front-on plants the pencil; the color wave races at the camera.'),
 ('08_band_on_stage_0147.png', '08 · 1:47 (3D)', 'A band on a stage, front-on: one colored spotlight per member, no keyword over a head.'),
 ('09_slab_fixtures.png', '09 · 1:26.9 (+3:00.2)', 'FIXTURES! carved into the slab as it slams up: the biggest object on screen.'),
 ('10_slab_functions.png', '10 · 1:29.9 (+3:03.1)', "FUNCTIONS! the carving lights up in rainbow; Ricky's sound beam links the slabs."),
 ('11_outro_page.png', '11 · outro (~3:11–3:27)', 'The same page in color with all three; SAVE COMPLETE · 2026 stamp, end-card lines, dedication.'),
]
TW, TH = 760, 428; PAD = 26; COLS = 3; LAB = 92
rows = (len(ITEMS) + COLS - 1) // COLS
out = Image.new('RGB', (COLS * TW + (COLS + 1) * PAD, 90 + rows * (TH + LAB + PAD) + PAD), (24, 24, 28)); d = ImageDraw.Draw(out)
d.text((PAD, 24), 'v4 Pass A · Tier-2 target stills (for Jade: likeness + paper art; 3D frames are targets for Pass B)', font=FT, fill=(240, 240, 240))
def wrap(t, f, w):
    out, cur = [], ''
    for word in t.split(' '):
        c = (cur + ' ' + word).strip()
        if d.textlength(c, font=f) > w and cur: out.append(cur); cur = word
        else: cur = c
    return out + [cur]
for i, (f, lab, intent) in enumerate(ITEMS):
    x = PAD + (i % COLS) * (TW + PAD); y = 90 + (i // COLS) * (TH + LAB + PAD)
    out.paste(Image.open(S + f).convert('RGB').resize((TW, TH), Image.LANCZOS), (x, y))
    d.text((x, y + TH + 6), lab, font=FB, fill=(255, 205, 90))
    for k, line in enumerate(wrap(intent, F, TW)[:2]):
        d.text((x, y + TH + 38 + k * 26), line, font=F, fill=(225, 225, 230))
out.save(R + 'engine/out/review/v4_stills/stills_sheet.jpg', quality=88); print(out.size)
