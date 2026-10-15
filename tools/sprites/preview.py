"""Review helpers: preview.py sheet OUT.png NAME... (stack strips at 8x) ; preview.py gif OUT.gif NAME [fps]"""
import sys, json
from PIL import Image
R = "/home/jade/Documents/vibesong/assets/sprites/"
meta = json.load(open(R + "sprites.json"))["sprites"]
def strip(n): return Image.open(R + meta[n]["file"]).convert("RGBA")
if sys.argv[1] == "sheet":
    out, names = sys.argv[2], sys.argv[3:]
    ims = [strip(n) for n in names]; pad = 4
    W = max(i.width for i in ims) + 2 * pad; H = sum(i.height + pad for i in ims) + pad
    c = Image.new("RGBA", (W, H), (104, 122, 140, 255)); y = pad
    for i in ims: c.alpha_composite(i, (pad, y)); y += i.height + pad
    c.resize((W * 8, H * 8), Image.NEAREST).convert("RGB").save(out)
else:
    out, n = sys.argv[2], sys.argv[3]; m = meta[n]; s = strip(n); z = 8
    fr = []
    for k in range(m["frames"]):
        f = Image.new("RGBA", (m["frame_w"], m["frame_h"]), (104, 122, 140, 255))
        f.alpha_composite(s.crop((k * m["frame_w"], 0, (k + 1) * m["frame_w"], m["frame_h"])))
        fr.append(f.resize((m["frame_w"] * z, m["frame_h"] * z), Image.NEAREST).convert("RGB"))
    fr[0].save(out, save_all=True, append_images=fr[1:], duration=int(1000 / m["fps"]), loop=0)
