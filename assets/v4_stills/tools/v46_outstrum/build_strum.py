#!/usr/bin/env python3
"""v46_outstrum (Jade 10-19 v4.5 pick: "End on Charlie strumming the 2011 page (3:14)")
The outro push (194.06-195.40) goes into the spread's LEFT page = the 2011 graphite page in the spread_v1 art (NOT the cold-open
page01 drawing: same composition, different drawing, so v45_open's arm01/hole01 cannot be reused). Same puppet method as v45_open
(assets/v4_stills/tools/v45_open/build_strum.py), cut from the spread texture itself.

Inputs
  media/act5/tex/spread_full_spreadR_v45r2.jpg     the spread as shown (5504x3072 spread px; the left page is identical in every live tex)
  assets/v4_stills/work/v46_outstrum/arm_in.png    512x512 crop of it at (520,1300) (spread px, 1:1)
  assets/v4_stills/work/v46_outstrum/arm_gen_a.png NBP edit of arm_in (gen_arm.py, tag v46_outstrum_arm_a): the guitar with the arm removed
                                                   (ECC vs arm_in outside the arm: identity, cc 0.996 -> used as is)
Outputs (media/act5/tex/)
  hole46.png     the clean guitar (NBP) inside the forearm footprint only (RGBA, box below); drawn over the untouched spread
  arm46m.png     the forearm+hand ALPHA (L) over the same box; spread.js samples the spread texture itself through it (so at rest the
                 arm is the page pixel for pixel at any resolution / mip level)
  strum46.json   box + pivots (spread px): elbow, wrist, hand; head patch for the nod
usage: .venv/bin/python assets/v4_stills/tools/v46_outstrum/build_strum.py"""
import json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
R = '/home/jade/Documents/vibesong/'
WK = R + 'assets/v4_stills/work/v46_outstrum/'; TEX = R + 'media/act5/tex/'
CX, CY, CN = 520, 1300, 512
# forearm + hand footprint (crop px; traced on arm_in with the gen overlay ov_reg.png): elbow tip, underside to the knuckles,
# the fingertips curled over the sound-hole ring, the top edge back up to the elbow crease, then the forearm/upper-arm line
POLY = [(62, 198), (76, 212), (96, 230), (121, 246), (146, 258), (171, 271), (196, 286), (216, 303), (231, 320), (246, 335), (261, 347),
        (273, 355), (285, 358), (296, 352), (302, 340), (308, 330), (309, 317), (301, 306), (292, 296), (283, 285), (273, 275), (260, 269),
        (245, 267), (230, 261), (220, 253), (205, 238), (190, 222), (175, 206), (160, 192), (150, 183), (130, 184), (110, 187), (90, 190), (75, 192)]
# (the underside + knuckles sit ~6 px below the traced outline so the arm's own lower outline stroke rides with it: no ghost line)
DIL = 9                                           # footprint dilation along the forearm (spread px): takes the outline strokes + soft shading
ELBOW, WRIST, HAND = (88, 197), (247, 290), (292, 318)   # crop px
CREASE = (150, 183)                               # inner elbow (forearm top edge meets the upper arm + dark T-shirt): held still in spread.js

page = np.asarray(Image.open(TEX + 'spread_full_spreadR_v45r2.jpg').convert('RGB'), np.float32)
crop = page[CY:CY + CN, CX:CX + CN]
G = np.asarray(Image.open(WK + 'arm_gen_a.png').convert('RGB').resize((CN, CN), Image.LANCZOS), np.float32)

SS = 4
mk = Image.new('L', (CN * SS, CN * SS), 0)
ImageDraw.Draw(mk).polygon([(x * SS, y * SS) for x, y in POLY], fill=255)
M = np.asarray(mk, np.float32).reshape(CN, SS, CN, SS).mean((1, 3)) / 255
M0 = M.copy()                                                          # the traced polygon itself (no rim)
Mb = ndimage.grey_dilation(M, size=(DIL, DIL)); Ms = ndimage.grey_dilation(M, size=(4, 4))
kx = np.clip((WRIST[0] + 6 - np.arange(CN)) / 10, 0, 1)[None, :]      # wide rim on the forearm, tight on the hand (sound hole)
M = Mb * kx + Ms * (1 - kx)
M = np.clip(ndimage.gaussian_filter(M, 0.8) * 1.15, 0, 1)

ring = ndimage.binary_dilation(M > 0.02, iterations=16) & ~ndimage.binary_dilation(M > 0.02, iterations=4)
ring[:200, :150] = False                                               # not the upper arm (the gen removed it too)
gain = np.median(crop[ring], 0) / np.median(G[ring], 0); print('ring median gain (NOT applied: skewed by the page\'s cast shading under the arm)', gain.round(4))
# plain paper matches within 1 % (page 239.9/230.7/222.1 vs gen 241.3/231.6/222.3 at crop [20:60, 400:500]) -> no tone change
gain = np.ones(3, np.float32)
G = np.clip(G * gain, 0, 255)

lum = lambda a: a @ np.array([0.299, 0.587, 0.114], np.float32)
same = ndimage.gaussian_filter(np.abs(lum(crop) - lum(G)), 0.8)
dk = 1 - np.clip((170 - lum(crop)) / 30, 0, 1) * np.clip((22 - same) / 10, 0, 1)   # dark pixels the gen reproduced = guitar, stays put
# on the hand: everywhere; along the forearm: only in the dilated rim outside the traced polygon (there the rim also picked up a few px
# of the guitar's upper-bout outline where it meets the forearm's top edge; those stay on the page instead of riding along)
rim = np.clip(1 - ndimage.gaussian_filter(M0, 0.8) * 1.5, 0, 1)
Ma = M * (kx * (1 - rim + rim * dk) + (1 - kx) * dk)

ys, xs = np.nonzero(M > 0.002); x0, x1, y0, y1 = xs.min() - 2, xs.max() + 3, ys.min() - 2, ys.max() + 3
Image.fromarray(np.clip(Ma[y0:y1, x0:x1] * 255 + 0.5, 0, 255).astype(np.uint8), 'L').save(TEX + 'arm46m.png')
Image.fromarray(np.clip(np.dstack([G[y0:y1, x0:x1], M[y0:y1, x0:x1] * 255]) + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(TEX + 'hole46.png')
S = lambda p: [round(p[0] + CX, 1), round(p[1] + CY, 1)]
lay = {'arm46': {'x': int(x0 + CX), 'y': int(y0 + CY), 'w': int(x1 - x0), 'h': int(y1 - y0), 'elbow': S(ELBOW), 'wrist': S(WRIST), 'hand': S(HAND), 'crease': S(CREASE)},
       # the head (nod): rotates about the base of the neck; weight 1 inside the head+cap ellipse (the whole cap is inside), 0 by the collar
       'head46': {'pivot': [868, 1388], 'center': [893, 1262], 'radii': [108, 98], 'fall': 38, 'box': [745, 1125, 1040, 1410]},
       'units': 'spread px (5504x3072, spread_full_*); world = (x/3072, 1 - y/3072)',
       'src': 'v46_outstrum build_strum.py (gen arm_gen_a.png, tag v46_outstrum_arm_a)'}
json.dump(lay, open(TEX + 'strum46.json', 'w'), indent=1); print(json.dumps(lay))

# check: at rest page + hole + arm(page) == page
a = Ma[..., None]; h = M[..., None]
rest = a * crop + (1 - a) * (h * G + (1 - h) * crop)
print('rest vs page: max', np.abs(rest - crop).max().round(2), 'mean', np.abs(rest - crop).mean().round(5))
# work views: the hole fill (no arm) and the footprint outline
base = h * G + (1 - h) * crop
Image.fromarray(np.clip(base[120:420, 20:360], 0, 255).astype(np.uint8)).resize((1020, 900), Image.LANCZOS).save(WK + 'view_base.png')
v = crop.copy(); edge = (M > 0.5) ^ ndimage.binary_erosion(M > 0.5); v[edge] = [255, 0, 0]
ea = (Ma > 0.5) ^ ndimage.binary_erosion(Ma > 0.5); v[ea & ~edge] = [0, 160, 255]
Image.fromarray(v[120:420, 20:360].astype(np.uint8)).resize((1020, 900), Image.NEAREST).save(WK + 'view_mask.png')
