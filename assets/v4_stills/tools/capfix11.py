"""#11: the model drew BOTH hair-pencil caps blue; recolor the image-left cap's blue pixels to the canon pink/orange
(#FF8A5C family) with a hue/saturation remap inside a small box (pixel edit, shading kept)."""
import numpy as np, colorsys
from PIL import Image
p = '/home/jade/Documents/vibesong/assets/v4_stills/work/s11_page.png'
im = Image.open(p).convert('RGB'); a = np.asarray(im, np.float32) / 255
x0, y0, x1, y1 = 1425, 655, 1455, 682
hsv = np.asarray(im.convert('HSV'), np.float32) / 255
for y in range(y0, y1):
    for x in range(x0, x1):
        r, g, b = a[y, x]; h, s, v = colorsys.rgb_to_hsv(r, g, b)
        if 0.5 < h < 0.75 and s > 0.25:
            nr, ng, nb = colorsys.hsv_to_rgb(0.04, min(1, s * 1.05 + 0.1), min(1, v * 1.05 + 0.05))
            a[y, x] = (nr, ng, nb)
Image.fromarray((a * 255).astype(np.uint8)).save(p)
