"""grid.py OUT.jpg cols width img1 [img2 ...]  -> labelled contact sheet (label = file stem)"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); fs = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in fs]; h = round(ims[0].height * w / ims[0].width)
rows = (len(ims) + cols - 1) // cols; G = Image.new('RGB', (cols * w, rows * h), (20, 20, 24)); d = ImageDraw.Draw(G)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', max(12, w // 22))
except Exception: font = ImageFont.load_default()
for i, (f, im) in enumerate(zip(fs, ims)):
    x, y = (i % cols) * w, (i // cols) * h; G.paste(im.resize((w, h), Image.LANCZOS), (x, y))
    lab = os.path.splitext(os.path.basename(f))[0]; d.rectangle((x, y, x + len(lab) * w // 36 + 8, y + w // 18), fill=(0, 0, 0)); d.text((x + 4, y + 2), lab, fill=(255, 230, 80), font=font)
G.save(out, quality=86); print(out, G.size)
