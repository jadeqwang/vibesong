"""overlay check: ovl.py PHOTO OUT.jpg -> resize to 1920x1080, draw projected glyph mask edges (red) + a side strip."""
import sys, numpy as np
from PIL import Image, ImageFilter
from glyphmask import glyph_mask
im = Image.open(sys.argv[1]).convert('RGB').resize((1920, 1080), Image.LANCZOS)
m = Image.fromarray(glyph_mask())
e = np.asarray(m.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(3))) > 40
a = np.asarray(im).copy(); a[e] = [255, 30, 30]
Image.fromarray(a).save(sys.argv[2], quality=88)
