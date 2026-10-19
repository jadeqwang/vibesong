"""Pass B paper M3: quick canon sheet for a take (full frames at 0 / 1/4 / 1/2 / 3/4 / end + a 2x head crop of each).
    .venv/bin/python tools/cutscenes/pb_takesheet.py TAKE.mp4 OUT.jpg HEADBOX(x0,y0,x1,y1 as fractions of the frame)"""
import sys, subprocess
from PIL import Image, ImageDraw
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
take, out = sys.argv[1], sys.argv[2]; hb = [float(v) for v in sys.argv[3].split(',')]
info = subprocess.run([FF, '-i', take], capture_output=True, text=True).stderr
import re
d = re.search(r'Duration: (\d+):(\d+):([\d.]+)', info); dur = int(d[1]) * 3600 + int(d[2]) * 60 + float(d[3])
ts = [0.0, dur * .25, dur * .5, dur * .75, max(dur - 0.08, 0)]
cols = []
for t in ts:
    raw = subprocess.run([FF, '-v', 'error', '-ss', f'{t:.3f}', '-i', take, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
    import io
    im = Image.open(io.BytesIO(raw)).convert('RGB'); W, H = im.size
    full = im.resize((480, round(480 * H / W)))
    hc = im.crop((int(hb[0] * W), int(hb[1] * H), int(hb[2] * W), int(hb[3] * H))); hc = hc.resize((480, round(480 * hc.height / hc.width)), Image.LANCZOS)
    c = Image.new('RGB', (480, full.height + hc.height + 18), (16, 16, 20)); c.paste(full, (0, 18)); c.paste(hc, (0, 18 + full.height))
    ImageDraw.Draw(c).text((4, 3), f't {t:.2f}s', fill=(255, 220, 0)); cols.append(c)
S = Image.new('RGB', (480 * len(cols), max(c.height for c in cols)), (16, 16, 20))
for i, c in enumerate(cols): S.paste(c, (i * 480, 0))
S.save(out, quality=88); print(out)
