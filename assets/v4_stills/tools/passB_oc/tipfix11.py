#!/usr/bin/env python3
"""#11 canon fix (coordinator M1 call 4): the pink-cap hair pencil's sharpened end poked out below the bun. The NBP edit
work/passB_oc/tip11_gen_a.png (crop (1280,503)-(1792,1015) of s11_page, tag pB_oc_s11_tipfix) removed it; composite it back
ONLY inside a feathered capsule around that protruding segment -> work/passB_oc/s11_page_tipfix.png"""
import numpy as np
from PIL import Image
from scipy import ndimage
W = '/home/jade/Documents/vibesong/assets/v4_stills/work/'
X0, Y0 = 1280, 503
src = np.asarray(Image.open(W + 's11_page.png').convert('RGB'), np.float32)
gen = np.asarray(Image.open(W + 'passB_oc/tip11_gen_a.png').convert('RGB').resize((512, 512), Image.LANCZOS), np.float32)
inp = src[Y0:Y0 + 512, X0:X0 + 512]
# integer registration of the gen to the crop (phase correlation on luminance)
a = inp.mean(2) - inp.mean(); b = gen.mean(2) - gen.mean()
F = np.fft.fft2(a) * np.conj(np.fft.fft2(b)); r = np.fft.ifft2(F / (np.abs(F) + 1e-6)).real
dy, dx = np.unravel_index(r.argmax(), r.shape); dy = dy if dy < 256 else dy - 512; dx = dx if dx < 256 else dx - 512
gen = np.roll(gen, (dy, dx), (0, 1)); print('shift', dy, dx)
# capsule around the protruding pencil end (crop px): from just under the bun to past the point
P0, P1, RAD = np.array([229., 252.]), np.array([266., 306.]), 15
yy, xx = np.mgrid[0:512, 0:512]; v = P1 - P0; u = np.clip(((xx - P0[0]) * v[0] + (yy - P0[1]) * v[1]) / (v @ v), 0, 1)
d = np.hypot(xx - (P0[0] + u * v[0]), yy - (P0[1] + u * v[1]))
m = ndimage.gaussian_filter((d < RAD).astype(np.float32), 3)[..., None]
out = src.copy(); out[Y0:Y0 + 512, X0:X0 + 512] = inp * (1 - m) + gen * m
Image.fromarray(out.astype(np.uint8)).save(W + 'passB_oc/s11_page_tipfix.png')
Image.fromarray(out[Y0:Y0 + 512, X0:X0 + 512].astype(np.uint8)).save(W + 'passB_oc/tip11_result.png')
