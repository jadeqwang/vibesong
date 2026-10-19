#!/usr/bin/env python3
"""v4 Pass B (open_close): the SAVE FILE FOUND · 2011 · CONTINUE? screen (#02) as layers for the engine
(scenes/act1/char_select.js). Same drawing code as the approved still (compose.py s02: bricks, gold frames, PressStart2P,
the approved sprites), split so the engine can animate: the button states, the press flash, the torches, Jade's press,
and the save year rolling 2011 -> 2026 after CONTINUE.
Output: media/act5/tex/save02/*.png + layout.json (1920x1080 frame px, top-left)
usage: .venv/bin/python assets/v4_stills/tools/passB_oc/build_save02.py"""
import json, os, sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
R = '/home/jade/Documents/vibesong/'
sys.path.insert(0, R + 'assets/v4_stills/tools')
from compose import bricks, frame, ptext, PX, GOLD, GOLD_HI, GOLD_LO, W, H
OUT = R + 'media/act5/tex/save02/'; os.makedirs(OUT, exist_ok=True)
lay = {}

def crop_save(name, img, box=None):
    """save the non-transparent bbox of an RGBA layer with its placement"""
    a = np.asarray(img)[..., 3]; ys, xs = np.nonzero(a)
    x0, y0, x1, y1 = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1) if box is None else box
    img.crop((x0, y0, x1, y1)).save(OUT + name + '.png'); lay[name] = {'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0)}

def layer(): return Image.new('RGBA', (W, H), (0, 0, 0, 0))

# ---------------------------------------------------------------- background: wall, torch bases, title, save slot (no year digits)
bg = Image.new('RGB', (W, H)); bricks(bg); g = ImageDraw.Draw(bg)
frame(g, (360, 66, W - 360, 186)); ptext(bg, (W // 2, 90), 'SAVE FILE FOUND', 72, GOLD_HI, anchor='ma', scale=9)
frame(g, (300, 250, W - 300, 650), inner=(14, 30, 70))
port = Image.open(R + 'assets/sprites/portrait_charlie.png').convert('RGBA').crop((0, 0, 32, 32)).resize((256, 256), Image.NEAREST)
g.rectangle((350, 288, 350 + 256 + 24, 288 + 256 + 24), fill=GOLD); g.rectangle((362, 300, 362 + 256, 300 + 256), fill=(40, 52, 110))
bg.paste(port, (362, 300), port)
ptext(bg, (362 + 128, 584), 'CHARLIE', 24, (230, 230, 240), anchor='ma', scale=4)
ptext(bg, (708, 560), '"fixtures & functions"', 32, (110, 220, 160), scale=4)
for x in (150, W - 150):                       # torch bracket + cup (flames are their own layers)
    p = PX; g.rectangle((x - 5 * p, 120 + 10 * p, x + 5 * p, 120 + 12 * p), fill=(120, 84, 30)); g.rectangle((x - 3 * p, 120 + 6 * p, x + 3 * p, 120 + 10 * p), fill=(200, 40, 60))
bg.save(OUT + 'bg.png'); lay['bg'] = {'x': 0, 'y': 0, 'w': W, 'h': H}

# ---------------------------------------------------------------- torch flames (3 frames, the still's flame = frame 0)
for f in range(3):
    im = layer(); g = ImageDraw.Draw(im); p = PX; o = [0, 1, -1][f] * p
    for x in (150, W - 150):
        g.rectangle((x - 2 * p + o, 120 + 1 * p - (f == 1) * p, x + 2 * p + o, 120 + 6 * p), fill=(248, 160, 40))
        g.rectangle((x - 1 * p + o, 120 - 2 * p - (f == 2) * p, x + 1 * p + o, 120 + 4 * p), fill=(255, 230, 120))
    crop_save(f'flame{f}', im)

# ---------------------------------------------------------------- the save year (2011 ... 2026), same type as the still
for y in range(2011, 2027):
    im = layer(); ptext(im, (700, 290), str(y), 200, (250, 244, 220), scale=26)
    crop_save(f'year{y}', im, (690, 280, 1560, 520))

# ---------------------------------------------------------------- buttons
bx0, by0, bx1, by1 = 980, 722, 1640, 842
def button(name, inner, txt, shift, glow=False):
    im = layer()
    if glow:
        fl = Image.new('L', (W, H), 0); ImageDraw.Draw(fl).rounded_rectangle((bx0 - 50, by0 - 50, bx1 + 50, by1 + 50), radius=60, fill=150)
        fl = fl.filter(ImageFilter.GaussianBlur(28)); im = Image.new('RGBA', (W, H), (255, 244, 200, 0)); im.putalpha(fl)
    g = ImageDraw.Draw(im); frame(g, (bx0, by0 + shift, bx1, by1 + shift), inner=inner)
    ptext(im, ((bx0 + bx1) // 2, by0 + 34 + shift), 'CONTINUE?', 56, txt, shadow=(255, 246, 200) if inner[0] > 200 else (6, 8, 20), anchor='ma', scale=7)
    crop_save(name, im, (bx0 - 110, by0 - 110, bx1 + 110, by1 + 110))
button('cont_dim', (20, 26, 60), (214, 162, 42), 0)            # not selected
button('cont_hi', (250, 214, 96), (40, 24, 6), 0)              # selected (blinks with cont_dim before the press)
button('cont_down', (250, 214, 96), (40, 24, 6), PX, glow=True)  # pressed: the approved still
im = layer(); g = ImageDraw.Draw(im); frame(g, (980, 890, 1640, 966), inner=(20, 26, 60))
ptext(im, (1310, 910), 'NEW GAME', 32, (90, 100, 140), shadow=None, anchor='ma', scale=5); crop_save('newgame', im)

# ---------------------------------------------------------------- Jade: the approved hair-down sprite, graphite line cropped
spr = Image.open(R + 'assets/sprites/jade_draw_graphite_hi.png').convert('RGBA')
a = np.asarray(spr).copy(); a[:, 93:, 3] = 0; spr = Image.fromarray(a)
k = 5; spr = spr.resize((spr.width * k, spr.height * k), Image.NEAREST)
sx, sy = bx0 + 6 - 91 * k, by0 + 40 - 33 * k                 # pressed pose: the pink eraser end on the button's left edge
spr.save(OUT + 'jade.png'); lay['jade'] = {'x': sx, 'y': sy, 'w': spr.width, 'h': spr.height}
sh = Image.new('RGBA', spr.size, (6, 8, 20, 0)); sh.putalpha(spr.split()[3].point(lambda v: 110 if v else 0))
sh.save(OUT + 'jade_shadow.png'); lay['jade_shadow'] = {'x': sx + 2 * k, 'y': sy + 2 * k, 'w': spr.width, 'h': spr.height}
json.dump(lay, open(OUT + 'layout.json', 'w'), indent=1)

# reference: the still rebuilt from the layers at the press (must match assets/v4_stills/02_save_file_continue.png)
ref = Image.open(OUT + 'bg.png').convert('RGBA')
for nme in ['flame0', 'year2011', 'cont_down', 'newgame', 'jade_shadow', 'jade']:
    ref.alpha_composite(Image.open(OUT + nme + '.png').convert('RGBA'), (lay[nme]['x'], lay[nme]['y']))
ref.convert('RGB').save(R + 'assets/v4_stills/work/passB_oc/ref02_layers.png')
st = np.asarray(Image.open(R + 'assets/v4_stills/02_save_file_continue.png').convert('RGB'), np.float32)
print('ref vs still: mean abs diff', np.abs(np.asarray(ref.convert('RGB'), np.float32) - st).mean())
