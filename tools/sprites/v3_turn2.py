import sys; sys.path.insert(0, "/home/jade/Documents/vibesong/tools/sprites")
import numpy as np, cv2
from PIL import Image, ImageDraw
from scipy import ndimage
import costume_comp as CC
def _pencilize(rgba, under):
    a = np.array(rgba).astype(float); rng = np.random.default_rng(1)
    a[..., :3] = np.clip(a[..., :3] * (1 + rng.normal(0, 0.012, a.shape[:2]))[..., None] - 4, 0, 255)
    return Image.fromarray(a.astype(np.uint8)).filter(__import__("PIL.ImageFilter").ImageFilter.GaussianBlur(0.45))
CC.pencilize = _pencilize
V = "/home/jade/Documents/vibesong/"
img = Image.open(V + "assets/sheets/raw/v3_turn_stage1.png").convert("RGBA")
def inpaint_box(img, box, thr=110, grow=3):
    a = np.array(img.convert("RGB")); x0, y0, x1, y1 = box
    g = a[y0:y1, x0:x1].mean(-1); m = np.zeros(a.shape[:2], np.uint8)
    m[y0:y1, x0:x1] = ndimage.binary_dilation(g < thr, iterations=grow)
    img.paste(Image.fromarray(cv2.inpaint(a, m * 255, 5, cv2.INPAINT_TELEA)))
def inpaint_ellipse(img, box):
    a = np.array(img.convert("RGB")); m = Image.new("L", img.size, 0); ImageDraw.Draw(m).ellipse(box, fill=255)
    img.paste(Image.fromarray(cv2.inpaint(a, np.array(m), 5, cv2.INPAINT_TELEA)))
mode = sys.argv[1] if len(sys.argv) > 1 else "all"
# rings drawn by the edit -> real 1420 MHz artwork
CC.patch(img, 1185.5, 484, 50, 64)
CC.patch(img, 1679, 484.5, 62, 64)
g = np.array(img.convert("L")).astype(int)
print("front arm outline cols:", [(y, [x for x in range(540, 600) if g[y, x] < 80]) for y in (450, 470, 490, 510, 530)])
print("back sleeve cols:", [(y, [x for x in range(2090, 2150) if g[y, x] < 80]) for y in (440, 470, 490, 510, 540)])
img.save(V + "assets/sheets/raw/v3_turn_stage2.png")
def inpaint_partial(img, box, xline, side, thr=85):
    a = np.array(img.convert("RGB")); g = a.mean(-1); m = np.zeros(g.shape, bool); x0, y0, x1, y1 = box
    for y in range(y0, y1):
        xl = xline(y)
        for x in range(x0, x1):
            if (side == "left" and x < xl - 2.5) or (side == "right" and x > xl + 2.5):
                m[y, x] = g[y, x] < thr
    m = ndimage.binary_dilation(m, iterations=2)
    img.paste(Image.fromarray(cv2.inpaint(a, m.astype(np.uint8) * 255, 4, cv2.INPAINT_TELEA)))
fl = lambda y: 555 + (y - 450) * 21 / 80
CC.patch(img, 552, 488, 26, 52, clip_line=((555, 450), (576, 530)))
bl = lambda y: 2130 - (y - 440) * 0.23
CC.patch(img, 2131, 489, 22, 56)
# back lettering: erase the model's, place the real artwork per spec under the dot
CC.erase_old_patches  # (unused)
D = 2348 - 2226; L = Image.open(CC.ART + "back_rare_earth_lettering.png").convert("RGBA"); L = L.crop(L.getbbox())
lw, lh = D * 7.5 / 7.75, D * 0.701 / 7.75
L = L.resize((int(lw * 3), int(lh * 3)), Image.LANCZOS).resize((int(round(lw)), int(round(lh))), Image.LANCZOS)
la = np.array(L).astype(float); la[..., :3] = [0x27, 0x27, 0x29]; L = Image.fromarray(la.astype(np.uint8))
img.alpha_composite(L, (int(round((2226 + 2348) / 2 - L.width / 2)), int(round(512 + D / 7.75))))
img.save(V + "assets/sheets/raw/v3_turn_stage2.png"); print("stage2 ok")
