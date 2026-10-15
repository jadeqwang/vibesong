"""Hand + face crops across a window of a playing take (for plausibility checks).
    python tools/cutscenes/handstrip.py CLIP START OUT handbox facebox   (boxes normalised x0,y0,x1,y1)"""
import sys, av
from PIL import Image, ImageDraw
clip, t0, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
hb, fb = [[float(v) for v in a.split(",")] for a in sys.argv[4:6]]
with av.open(clip) as c:
    st = c.streams.video[0]; fps = float(st.average_rate); F = [f.to_image() for f in c.decode(st)]
ts = [t0 + k * 0.2 for k in range(7)]
rows = []
for b, H in ((hb, 300), (fb, 240)):
    row = []
    for t in ts:
        im = F[min(len(F) - 1, round(t * fps))]; W, Hh = im.size
        cr = im.crop((int(b[0] * W), int(b[1] * Hh), int(b[2] * W), int(b[3] * Hh))); cr = cr.resize((round(cr.width * H / cr.height), H))
        ImageDraw.Draw(cr).text((4, 4), f"{t:.2f}s", fill=(255, 0, 0)); row.append(cr)
    rows.append(row)
Wt = max(sum(r.width for r in row) for row in rows); S = Image.new("RGB", (Wt, 540), "white"); y = 0
for row in rows:
    x = 0
    for r in row: S.paste(r, (x, y)); x += r.width
    y += row[0].height
S.save(out, quality=90); print(out)
