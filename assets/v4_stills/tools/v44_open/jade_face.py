#!/usr/bin/env python3
"""v4.4 (unit v44_open, Jade 10-19 "0:08 why is Jade's sprite's face kinda messed up here?"): redraw the face of the
hair-down HI sprite assets/sprites/jade_draw_graphite_hi.png (the SAVE FILE screen sprite, also press_start 11-14 s).
The v3 face was 1-px hair-coloured dot eyes, a 1-px nose dot, scattered blush and a bang across the face.
New face (canon): larger 2x3 eyes with a highlight, two slightly different brows (image-left straight, image-right slight arch),
centre-parted taller forehead under the existing hair volume, heart-shaped face with a rounded (not pointy) chin.
Reads the pristine copy (backup) so it is idempotent. The 72x44 lo-res sprite is rebuilt from the same patch (2x box -> nearest).
usage: .venv/bin/python assets/v4_stills/tools/v44_open/jade_face.py [a|smile] [out.png]   (a = in the show)"""
import sys
from PIL import Image
R = '/home/jade/Documents/vibesong/'
SRC = R + 'engine/out/bak_v44/v44_open/sprites/jade_draw_graphite_hi.png'   # pristine v4.3 sprite
OUT = sys.argv[2] if len(sys.argv) > 2 else R + 'assets/sprites/jade_draw_graphite_hi.png'
C = {'h': (39, 33, 35), 'H': (59, 49, 48), 'g': (49, 41, 41), 'd': (29, 24, 27), '#': (20, 16, 20), 's': (249, 184, 120),
     'z': (241, 156, 106), 'b': (244, 146, 112), 'e': (24, 18, 24), 'w': (252, 250, 246), 'i': (104, 64, 46), 'r': (200, 84, 86),
     'B': (60, 48, 48), 'n': (226, 140, 98)}
X0 = 46
# rows y -> 19 chars for x 46..64 ('.' = keep the original pixel)
PATCH = {
 24: 'hhhhhHHHhhhhhhhh#..',
 25: 'hhhhHHhhhhshhhhh#..',
 26: 'hhhHhhhssssssshh#..',
 27: 'hhHhhBBBsssBBBsh#..',
 28: 'hhhhhsssssssssBh#..',
 29: 'hhhhheeessseeesh#..',
 30: 'hhhhhswessswessh#..',
 31: 'hhhhhsiesssiessh#..',
 32: 'hhhhhsiisssiissh#..',
 33: 'hhhhhsbsszssbssh#..',
 34: 'hhhhhssssssssssh#..',
 35: 'hhhhhzsssrrssszh#..',
 36: 'hhhhhhzsssssszhh#..',
 37: 'hhhhhhhzsssszhhh#..',
 38: 'hhhhhhhhzzzzhhh....',
 39: '...hhhhhsssshhhhh..',
}
VARIANT = sys.argv[1] if len(sys.argv) > 1 else 'a'
if VARIANT == 'smile':                      # variant B: a closed smile (corners up) instead of the small neutral mouth
    C['m'] = (168, 64, 66)
    PATCH[34] = 'hhhhhsssmssmsssh#..'
    PATCH[35] = 'hhhhhzsssmmssszh#..'
def apply(im):
    px = im.load()
    for y, row in PATCH.items():
        assert len(row) == 19, (y, len(row))
        for k, ch in enumerate(row):
            if ch == '.': continue
            px[X0 + k, y] = C[ch] + (255,)
    return im
im = apply(Image.open(SRC).convert('RGBA'))
im.save(OUT); print('wrote', OUT)
