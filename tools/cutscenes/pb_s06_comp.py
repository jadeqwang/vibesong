"""Composite a lifted head crop back into still #06 inside a soft head/hair mask (everything below the brows untouched).
    python tools/cutscenes/pb_s06_comp.py HEAD_CROP.png OUT.png [BOTTOM_Y=258] [FEATHER=10]
Crop origin (180,40), 700x560. Mask = above BOTTOM_Y (crop coords) inside the head window x 20..640, gaussian feather."""
import sys, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
head, out = sys.argv[1:3]; by = float(sys.argv[3]) if len(sys.argv) > 3 else 258; fe = float(sys.argv[4]) if len(sys.argv) > 4 else 10
base = Image.open('assets/v4_stills/06_paper_0223.png').convert('RGB'); B = np.asarray(base).astype(float)
h = np.asarray(Image.open(head).convert('RGB').resize((700, 560), Image.LANCZOS)).astype(float)
m = np.zeros((560, 700)); m[:int(by), 20:640] = 1
m = gaussian_filter(m, fe); m[:, :] *= 1                       # soft edges (sky at the top/sides is the same paper anyway)
O = B.copy(); reg = O[40:600, 180:880]
O[40:600, 180:880] = reg * (1 - m[..., None]) + h * m[..., None]
Image.fromarray(O.clip(0, 255).round().astype(np.uint8)).save(out)
Image.fromarray((m * 255).astype(np.uint8)).save(out[:-4] + '_mask.png'); print(out)
