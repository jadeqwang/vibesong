"""Pass B paper M3: before/after sheet for the 03/04/05 forehead lift (full still pair + 2x head crops with guide lines).
    .venv/bin/python tools/cutscenes/pb_m3_stills.py  -> engine/out/review/passB/paper/m3_stills_before_after.jpg"""
from PIL import Image, ImageDraw, ImageFont
S = 'assets/v4_stills/'; O = 'engine/out/review/passB/paper/m3_stills_before_after.jpg'
FB = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26); F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 20)
#        name, head crop box (still px), brow y, hairline y before/after, nose y, label
C = [('03_paper_0020', (230, 20, 730, 440), 280, 200, 182, 398, '03 · 0:20.17 · forehead 80 -> 98 px (0.68x -> 0.83x the brow-to-nose), crown +22 px; pencils +19/21 px'),
     ('04_paper_0048', (700, 0, 1260, 420), 266, 179, 158, 388, '04 · 0:48.57 · forehead 87 -> 108 px (0.71x -> 0.89x), crown +28 px; pencils +12 px (blue cap stays in frame)'),
     ('05_paper_0147', (800, 140, 1160, 440), 365, 300, 286, 464, '05 · 1:47.15 (stage_3d) · forehead 65 -> 79 px (0.66x -> 0.80x), crown +21 px; pencils +10 px (both still meet the hair)')]
blocks = []
def lab(t, s='', h=66):
    im = Image.new('RGB', (1920, h), (28, 26, 34)); d = ImageDraw.Draw(im); d.text((14, 8), t, font=FB, fill=(255, 210, 90))
    if s: d.text((14, 40), s, font=F, fill=(225, 225, 235))
    return im
blocks.append(lab('v4 Pass B · paper · M3 · forehead a bit taller, more head/hair volume on stills 03 / 04 / 05 (same note as #06)',
                  'left = APPROVED still (unchanged file) | right = NEW *_v2.png · NBP volume edit (crown/bun) + smooth lift (0 at the brows) · the ORIGINAL pencils, moved rigidly: straight, X, both caps up · face below the brows untouched', 80))
for n, box, brow, h0, h1, nose, t in C:
    a = Image.open(S + n + '.png').convert('RGB'); b = Image.open(S + n + '_v2.png').convert('RGB')
    blocks.append(lab(t, f'guides on the 2x crops: red = hairline (before / after), blue = brows, green = nose bottom · files: {S}{n}.png -> {S}{n}_v2.png'))
    row = Image.new('RGB', (1920, 545), (16, 16, 20)); row.paste(a.resize((956, 538)), (0, 4)); row.paste(b.resize((956, 538)), (964, 4)); blocks.append(row)
    w, h = box[2] - box[0], box[3] - box[1]; s = min(956 / w, 840 / h); W, Hh = int(w * s), int(h * s)
    row = Image.new('RGB', (1920, Hh + 8), (16, 16, 20))
    for i, (im, hl) in enumerate(((a, h0), (b, h1))):
        c = im.crop(box).resize((W, Hh), Image.LANCZOS); d = ImageDraw.Draw(c)
        for yy, col in ((hl, (230, 30, 30)), (brow, (30, 60, 230)), (nose, (0, 150, 0))):
            Y = (yy - box[1]) * s; d.line((0, Y, 60, Y), fill=col, width=3); d.line((W - 60, Y, W, Y), fill=col, width=3)
        row.paste(c, (i * 964 + (956 - W) // 2, 4))
    blocks.append(row)
H = sum(x.height for x in blocks); out = Image.new('RGB', (1920, H), (16, 16, 20)); y = 0
for x in blocks: out.paste(x, (0, y)); y += x.height
out.save(O, quality=88); print(O, out.size)
