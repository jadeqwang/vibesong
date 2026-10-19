"""M3b sheet: M3 (bead letters) | M3b (graphite branch + pink blossoms) at 1080p (shown 960x540), plus a 1x 540p crop row of 18.3.
usage: m3b_sheet.py <dir with M_<t>.png / B_<t>.png> <out.jpg>"""
import sys
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
TS = ['18.07', '18.3', '18.8', '19.3']
NOTE = {'18.07': 'before the sung onset: buds on the branches', '18.3': 'open (left to right from 18.10)',
        '18.8': 'the edge eats the branch, blossoms burst into petals', '19.3': 'the last s drops under Ricky'}
W, H, PAD = 960, 540, 8
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22); f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
except OSError:
    F = f = ImageFont.load_default()
CROP = (300, 250, 960, 470)            # in 540p coordinates: the bridge at 18.3
cw, ch = CROP[2] - CROP[0], CROP[3] - CROP[1]
sheet = Image.new('RGB', (2 * W + 3 * PAD, 64 + len(TS) * (H + 34 + PAD) + 40 + ch + 40), (24, 24, 30))
d = ImageDraw.Draw(sheet)
d.text((PAD, 10), 'M3 (bead letters) | M3b (graphite branch + pale-pink 5-petal blossoms), 1080p, --look k08b+cs', font=F, fill=(240, 240, 240))
d.text((PAD, 38), 'same frozen tree, only kaizo.js differs; geometry / timing / petals / banner identical', font=f, fill=(180, 180, 190))
y = 64
for t in TS:
    for c, k in enumerate(['M', 'B']):
        sheet.paste(Image.open(f'{src}/{k}_{t}.png').convert('RGB').resize((W, H), Image.LANCZOS), (PAD + c * (W + PAD), y))
    d.text((PAD, y + H + 6), f't = {t}   ' + NOTE[t], font=f, fill=(240, 220, 120)); y += H + 34 + PAD
d.text((PAD, y + 6), '540p at 1x (review size), t = 18.3:   M3 | M3b', font=F, fill=(240, 240, 240)); y += 40
for c, k in enumerate(['M', 'B']):
    im = Image.open(f'{src}/{k}_18.3.png').convert('RGB').resize((960, 540), Image.LANCZOS).crop(CROP)
    sheet.paste(im, (PAD + c * (W + PAD), y))
sheet.save(out, quality=90); print('wrote', out, sheet.size)
