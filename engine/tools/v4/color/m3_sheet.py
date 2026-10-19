"""M3 (blossoms bridge) before/after sheet: rows = song times, columns = old "because" | new "blossoms" (1080p stills, shown at 960x540).
usage: m3_sheet.py <dir with before_<t>.png / after_<t>.png> <out.jpg>"""
import sys
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
TS = ['18.3', '18.8', '19.3', '19.8', '20.1']
NOTE = {'18.3': 'bloomed on the sung "blossoms" (18.10); banner moved below the bridge',
        '18.8': 'b l o dropped as the edge reaches them (s going), petals; Ricky on solid letters (he used to run on air)',
        '19.3': 'the last s drops under Ricky (19.30); m bursts into petals',
        '19.8': 'BOING off the hat, same frame',
        '20.1': 'ledge (beat 46) unchanged; card 03 cuts in at 20.167'}
W, H, PAD, HEAD = 960, 540, 8, 64
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22); f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
except OSError:
    F = f = ImageFont.load_default()
sheet = Image.new('RGB', (2 * W + 3 * PAD, HEAD + len(TS) * (H + 34 + PAD) + 40), (24, 24, 30))
d = ImageDraw.Draw(sheet)
d.text((PAD, 10), 'M3 blossoms bridge: before ("because", graphite block letters) | after ("blossoms", graphite blossoms)', font=F, fill=(240, 240, 240))
d.text((PAD, 38), '1080p stills, --fig native --figscale 1.3 --figres 2.5 --look k08b+cs, one frozen tree (only kaizo.js / level.js differ)', font=f, fill=(180, 180, 190))
y = HEAD
for t in TS:
    for c, k in enumerate(['before', 'after']):
        im = Image.open(f'{src}/{k}_{t}.png').convert('RGB').resize((W, H), Image.LANCZOS)
        sheet.paste(im, (PAD + c * (W + PAD), y))
    d.text((PAD, y + H + 6), f't = {t}   ' + NOTE[t], font=f, fill=(240, 220, 120))
    y += H + 34 + PAD
d.text((PAD, y + 6), 'Outside 14-21: stills at 12 and 25 (1080p) and 5 / 13.5 / 13.95 / 23.8 / 24.5 / 27 / 30 / 35 / 40 / 60 (540p) are byte-identical before vs after.', font=f, fill=(150, 220, 150))
sheet.save(out, quality=88)
print('wrote', out, sheet.size)
