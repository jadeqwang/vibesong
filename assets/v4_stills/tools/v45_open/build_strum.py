#!/usr/bin/env python3
"""v45_open (Jade 10-19: "0:00 - can we animate some guitar strumming on Charlie, even here?")
Splits Charlie's strumming forearm + hand off the 2011 page (#01) so cold_open.js can swing it on the strums.

Inputs
  media/act5/tex/page01.jpg                       the page as shown (1920x1080 frame px)
  assets/v4_stills/work/v45_open/arm_in.png       512x512 crop of work/passB_oc/plate01_clean_a.png at (746,860) (source px)
  assets/v4_stills/work/v45_open/arm_gen_a.png    NBP edit of arm_in (gen_arm.py, tag v45_open_arm_a): the guitar with the arm removed
Outputs (media/act5/tex/)
  hole01.png                       the clean guitar (NBP) inside the forearm footprint only (RGBA, same box as arm01), drawn over page01
  arm01.png                        the forearm + hand cut from page01 (RGBA, alpha = the traced footprint, 1 px feather)
  strum01.json                     arm01 placement + pivots (frame px): elbow, wrist, hand; head pivot for the nod variant
At rest (no rotation) page01 + hole01 + arm01 == page01 (checked below: max abs diff printed).
usage: .venv/bin/python assets/v4_stills/tools/v45_open/build_strum.py"""
import json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
R = '/home/jade/Documents/vibesong/'
WK = R + 'assets/v4_stills/work/v45_open/'; TEX = R + 'media/act5/tex/'
CX, CY, CN = 746, 860, 512                      # crop origin + size in source px (2752x1536)
SX, SY = 1920 / 2752, 1080 / 1536               # source px -> frame px
# the forearm + hand footprint, traced on arm_in (crop px): elbow tip, underside to the bridge, the hand, wrist top, forearm top, crease
POLY = [(89, 173), (100, 184), (120, 200), (150, 218), (185, 236), (200, 246), (215, 256), (232, 275), (250, 281), (265, 280), (271, 268),
        (268, 252), (265, 240), (258, 232), (250, 229), (230, 225), (217, 222), (200, 207), (180, 190), (160, 175), (152, 162), (120, 163)]
DIL = 7                                         # footprint dilation (frame px, odd): takes the arm's outline strokes + their soft edge shading along
ELBOW, WRIST, HAND = (100, 176), (222, 236), (248, 255)   # crop px

def to_frame(p): return ((p[0] + CX) * SX, (p[1] + CY) * SY)

page = np.asarray(Image.open(TEX + 'page01.jpg').convert('RGB'), np.float32)
gen = np.asarray(Image.open(WK + 'arm_gen_a.png').convert('RGB').resize((CN, CN), Image.LANCZOS), np.float32)
inp = np.asarray(Image.open(WK + 'arm_in.png').convert('RGB'), np.float32)

# footprint mask in frame px (supersampled polygon, dilated ~1.5 px so the arm's outline stroke is inside, 1 px feather)
SS = 4
mk = Image.new('L', (1920 * SS, 1080 * SS), 0)
ImageDraw.Draw(mk).polygon([(x * SS, y * SS) for x, y in map(to_frame, POLY)], fill=255)
M = np.asarray(mk, np.float32).reshape(1080, SS, 1920, SS).mean((1, 3)) / 255
Mb = ndimage.grey_dilation(M, size=(DIL, DIL)); Ms = ndimage.grey_dilation(M, size=(3, 3))
# the wide rim only along the forearm; the hand keeps a tight rim (a wide one dragged the dark sound hole along with the fingers)
kx = np.clip((to_frame(WRIST)[0] - 4 - np.arange(1920)) / 8, 0, 1)[None, :]
M = Mb * kx + Ms * (1 - kx)
M = np.clip(ndimage.gaussian_filter(M, 0.7) * 1.15, 0, 1)

# the gen (crop px) resampled into frame px over the crop's frame box, tone-matched to page01 outside the footprint
fy, fx = np.mgrid[0:1080, 0:1920].astype(np.float32)
cx = fx / SX - CX; cy = fy / SY - CY
inbox = (cx >= 0) & (cx <= CN - 1) & (cy >= 0) & (cy <= CN - 1)
G = np.stack([ndimage.map_coordinates(gen[..., k], [cy, cx], order=3, mode='nearest') for k in range(3)], -1)
ring = (ndimage.binary_dilation(M > 0.02, iterations=14) & ~(ndimage.binary_dilation(M > 0.02, iterations=3))) & inbox
gain = np.median(page[ring], 0) / np.median(G[ring], 0); print('tone gain', gain.round(4))
G = np.clip(G * gain, 0, 255)
base = page * (1 - M[..., None]) + G * M[..., None]
base[~inbox] = page[~inbox]

# between and around the curled fingers the page shows the sound hole, its ring and the strings: where the gen reproduced a darker
# page01 pixel there, it is the guitar, not the hand, so it stays on the page instead of riding along with the fingers (the arm layer goes transparent there)
lum = lambda a: a @ np.array([0.299, 0.587, 0.114], np.float32)
same = ndimage.gaussian_filter(np.abs(lum(page) - lum(G)), 0.8)          # the gen reproduced this pixel -> it is the guitar, not the hand
dk = 1 - np.clip((170 - lum(page)) / 30, 0, 1) * np.clip((22 - same) / 10, 0, 1)   # only for the darker pixels (ring, hole, strings)
Ma = M * (kx + (1 - kx) * dk)
# the arm layer: page01's pixels under the footprint, cropped to its bbox (+2 px); the hole fill: the gen under the same footprint
# (a separate small layer over the UNCHANGED page01, so the page texture itself is untouched: no re-encode anywhere else)
ys, xs = np.nonzero(M > 0.002); x0, x1, y0, y1 = xs.min() - 2, xs.max() + 3, ys.min() - 2, ys.max() + 3
arm = np.dstack([page[y0:y1, x0:x1], Ma[y0:y1, x0:x1] * 255])
Image.fromarray(np.clip(arm + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(TEX + 'arm01.png')
hole = np.dstack([G[y0:y1, x0:x1], M[y0:y1, x0:x1] * 255])
Image.fromarray(np.clip(hole + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(TEX + 'hole01.png')
rel = lambda p: [round(to_frame(p)[0] - x0, 1), round(to_frame(p)[1] - y0, 1)]
lay = {'arm01': {'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0),
                 'elbow': rel(ELBOW), 'wrist': rel(WRIST), 'hand': rel(HAND)},
       # (variant 'nod') the head: rotates about the base of the neck; weight 1 inside the head ellipse, 0 by the collar
       'head01': {'pivot': [726, 668], 'center': [742, 610], 'radii': [62, 56], 'fall': 24, 'box': [640, 520, 840, 700]},
       'src': 'v45_open build_strum.py (gen arm_gen_a.png, tag v45_open_arm_a)'}
json.dump(lay, open(TEX + 'strum01.json', 'w'), indent=1); print(json.dumps(lay))

# check: at rest base + arm == page01
a = Ma[..., None]; rest = page.copy(); rest[y0:y1, x0:x1] = arm[..., :3] * a[y0:y1, x0:x1] + base[y0:y1, x0:x1] * (1 - a[y0:y1, x0:x1])
print('rest vs page01: max', np.abs(rest - page).max().round(2), 'mean', np.abs(rest - page).mean().round(5))
# work views
Image.fromarray(np.clip(base[560:1000, 500:900], 0, 255).astype(np.uint8)).resize((800, 880), Image.LANCZOS).save(WK + 'view_base.png')
