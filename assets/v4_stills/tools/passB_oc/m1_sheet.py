#!/usr/bin/env python3
"""M1 sheet for the open_close unit: approved target | engine signature (1080p render), plus the beats around each."""
from PIL import Image, ImageDraw, ImageFont
R = '/home/jade/Documents/vibesong/'; M = R + 'engine/out/review/passB/open_close/m1/'
F = ImageFont.truetype(R + 'engine/assets/fonts/Inter.ttf', 22); FS = ImageFont.truetype(R + 'engine/assets/fonts/Inter.ttf', 17)
ROWS = [
 ('01 · 0:00 the 2011 page (frame 0 = thumbnail)', R + 'assets/v4_stills/01_sketchbook_2011.png', 's_0.png',
  [('0.20 the slash', 's_0.2.png'), ('0.50 pencil lifts off', 's_0.5.png'), ('1.05 page -> Level 1 (wipe)', 's_1.05.png'), ('1.30 Level 1', 's_1.3.png')]),
 ('02 · 0:07.18 CONTINUE pressed on the 808 hit (frame 7.20)', R + 'assets/v4_stills/02_save_file_continue.png', 's_7.2.png',
  [('6.80 slams in, wind-up', 's_6.8.png'), ('9.00 year rolls', 's_9.0.png'), ('10.60 lands on 2026', 's_10.6.png'), ('canon crops (11 | 02)', 'canon_crops.jpg')]),
 ('11 · 3:23 the outro page, last frame (202.97)', R + 'assets/v4_stills/11_outro_page.png', 's_202.97.png',
  [('194.80 push into the 2011 page', 's_194.8.png'), ('195.85 rainbow wipe to #11', 's_195.85.png'), ('198.20 SAVE COMPLETE stamp', 's_198.2.png'), ('200.60 title chops + credits', 's_200.6.png')]),
]
TW, TH, SW, SH, PAD = 940, 529, 465, 262, 14
W = PAD + 2 * (TW + PAD); rowh = 34 + TH + 30 + SH + 30
im = Image.new('RGB', (W, 60 + len(ROWS) * rowh), (24, 24, 28)); g = ImageDraw.Draw(im)
g.text((PAD, 16), 'v4 Pass B · open_close · M1: approved target (left) | engine render 1080p (right); small: the beats around it', font=F, fill=(240, 240, 240))
y = 60
for title, tgt, sig, extra in ROWS:
    g.text((PAD, y), title, font=F, fill=(255, 210, 63)); y += 34
    for k, (lab, p) in enumerate([('TARGET (approved still)', tgt), ('ENGINE', M + sig)]):
        x = PAD + k * (TW + PAD); a = Image.open(p).convert('RGB'); a.thumbnail((TW, TH)); im.paste(a, (x, y)); g.text((x, y + TH + 4), lab, font=FS, fill=(200, 200, 210))
    y += TH + 30
    for k, (lab, p) in enumerate(extra):
        x = PAD + k * (SW + PAD // 2); a = Image.open(M + p).convert('RGB'); a.thumbnail((SW, SH)); im.paste(a, (x, y)); g.text((x, y + SH + 4), lab, font=FS, fill=(200, 200, 210))
    y += SH + 30
im.save(M + '../m1_sheet.jpg', quality=90); print(im.size)
