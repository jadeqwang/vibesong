"""v4.3 paper: before/after sheet. Row 1: still 03 v2 vs v3 (chest-dot move) full + 2x chest crop. Rows 2-5: old (v4.2) vs new (v4.3)
card frames at the same song times, card 03 and card 04 (+ 2x head/chest crops), labelled with the coherent-motion numbers.
    .venv/bin/python tools/cutscenes/pb_v43_sheet.py OUT.jpg"""
import sys, subprocess, io
from PIL import Image, ImageDraw, ImageFont
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
B = "engine/out/bak_v4b/paper/v43/"
try: F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22); f2 = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
except Exception: F = f2 = ImageFont.load_default()
def frame(clip, t):
    b = subprocess.run([FF, '-v', 'error', '-ss', f'{t:.3f}', '-i', clip, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
    return Image.open(io.BytesIO(b)).convert('RGB')
W = 1920; rows = []
def label(im, txt, sub=None):
    d = ImageDraw.Draw(im); d.rectangle((0, 0, im.width, 30 if not sub else 54), fill=(0, 0, 0)); d.text((8, 3), txt, fill=(255, 255, 255), font=F)
    if sub: d.text((8, 31), sub, fill=(220, 220, 220), font=f2)
    return im
# row 1: stills
s2 = Image.open('assets/v4_stills/03_paper_0020_v2.png').convert('RGB'); s3 = Image.open('assets/v4_stills/03_paper_0020_v3.png').convert('RGB')
r = Image.new('RGB', (W, 420), 'white'); box = (330, 600, 790, 880)
for i, (s, t) in enumerate([(s2, 'still 03 v2 (v4.2): dot on HER RIGHT'), (s3, 'still 03 v3 (v4.3): dot on HER LEFT (canon)')]):
    r.paste(label(s.resize((640, 360)), t), (i * 960, 0)); c = s.crop(box).resize((300, 183)); r.paste(c, (i * 960 + 645, 60))
rows.append(r)
cards = [("03", B + "p0020_paper_0020.mp4", "media/cutscenes/paper_0020/paper_0020.mp4", 20.1667, [20.5, 21.3, 22.2, 23.2],
          "head 23 px/s, torso 8 px/s", "head 59 px/s, torso 39 px/s", (0.03, 0, 0.45, 0.85)),
         ("04", B + "p0048_paper_0048.mp4", "media/cutscenes/paper_0048/paper_0048.mp4", 48.5667, [48.7, 49.3, 49.9, 50.5],
          "head 16 px/s, torso 5 px/s", "head 38 px/s, torso 23 px/s", (0.33, 0, 0.74, 0.85))]
for card, old, new, t0, ts, mo, mn, cb in cards:
    for tag, clip, mtxt in [("v4.2 OLD", old, mo), ("v4.3 NEW (+6)", new, mn)]:
        r = Image.new('RGB', (W, 400), 'white'); x = 0
        for t in ts:
            im = frame(clip, t - t0); w, h = im.size; c = im.crop((int(cb[0] * w), int(cb[1] * h), int(cb[2] * w), int(cb[3] * h)))
            c = c.resize((int(c.width * 400 / c.height), 400)); r.paste(c, (x, 0)); d = ImageDraw.Draw(r); d.text((x + 6, 372), f"{t:.2f} s", fill=(0, 0, 0), font=f2); x += c.width + 4
        label(r, f"card {card} {tag}", f"coherent motion: {mtxt}"); rows.append(r)
H = sum(r.height + 6 for r in rows); S = Image.new('RGB', (W, H), (235, 235, 235)); y = 0
for r in rows: S.paste(r, (0, y)); y += r.height + 6
S.save(sys.argv[1], quality=88); print(sys.argv[1], S.size)
