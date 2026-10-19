"""Smooth vertical lift of the head above the brows (taller forehead + more crown), applied to a head crop.
    python tools/cutscenes/pb_headwarp.py IN.png OUT.png BROW_Y HAIRLINE_Y CROWN_Y D_HAIRLINE D_CROWN X0 X1
Content above BROW_Y moves up: 0 at BROW_Y, D_HAIRLINE at HAIRLINE_Y, D_CROWN at CROWN_Y and above (fading out near the
top edge); horizontal window X0..X1 with 40 px soft edges. Writes OUT and OUT_mask.png (where the lift > 0.3 px)."""
import sys, numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates, gaussian_filter
src, out = sys.argv[1:3]; by, hy, cy, dh, dc, x0, x1 = map(float, sys.argv[3:10])
im = np.asarray(Image.open(src).convert('RGB')).astype(float); H, W = im.shape[:2]
y = np.arange(H, dtype=float)
d = np.where(y >= by, 0, np.where(y >= hy, dh * (by - y) / (by - hy), np.where(y >= cy, dh + (dc - dh) * (hy - y) / (hy - cy), dc)))
d *= np.clip(y / 40.0, 0, 1)                                        # fade out at the very top edge
d = np.convolve(np.pad(d, 8, mode='edge'), np.ones(9) / 9, 'same')[8:-8]  # smooth the knees
x = np.arange(W, dtype=float)
wx = np.clip(np.minimum((x - (x0 - 40)) / 40, ((x1 + 40) - x) / 40), 0, 1); wx = wx * wx * (3 - 2 * wx)
D = d[:, None] * wx[None, :]
D = gaussian_filter(D, 3)
Y, X = np.meshgrid(y, x, indexing='ij')
outa = np.stack([map_coordinates(im[..., c], [Y + D, X], order=3, mode='nearest') for c in range(3)], -1)
Image.fromarray(outa.clip(0, 255).astype(np.uint8)).save(out)
Image.fromarray((np.clip(D / 0.3, 0, 1) * 255).astype(np.uint8)).save(out[:-4] + '_mask.png')
print(out, 'max lift', D.max())
