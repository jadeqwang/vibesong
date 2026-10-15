"""Composite the real Rare Earth costume artwork (read-only source repo) onto a generated paper turnaround.
Sleeve patch = inputs/sleeve_patch_1420MHz.png; back lettering = costume/artwork/back_rare_earth_lettering.png,
sized from the spec (line length = 7.5/7.75 of the dot, cap = 0.701/7.75, gap = 1.0/7.75)."""
import sys
import numpy as np
from PIL import Image, ImageFilter
V = "/home/jade/Documents/vibesong/"
ART = "/home/jade/Documents/1-music-shipped/rare-earth-techno-remix/costume/artwork/"

def pencilize(rgba, under):
    """Give flat artwork the paper/pencil grain of what it covers: multiply by normalised local luminance."""
    a = np.array(rgba).astype(float); u = np.array(under.convert("L")).astype(float)
    grain = np.clip(u / max(np.median(u), 1), 0.85, 1.05)[..., None]
    a[..., :3] = np.clip(a[..., :3] * grain, 0, 255)
    return Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.35))

def patch(img, cx, cy, w, h, clip_line=None):
    p = Image.open(V + "inputs/sleeve_patch_1420MHz.png").convert("RGBA").resize((w, h), Image.LANCZOS)
    x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
    p = pencilize(p, img.crop((x0, y0, x0 + w, y0 + h)))
    if clip_line:   # hide the part of the patch beyond the sleeve outline: x < x_at(y)
        (xa, ya), (xb, yb) = clip_line
        al = np.array(p)[..., 3].astype(float)
        for yy in range(h):
            Y = y0 + yy; xl = xa + (Y - ya) * (xb - xa) / (yb - ya) - 1.5
            al[yy, max(int(xl - x0), 0):] = 0
        p.putalpha(Image.fromarray(al.astype(np.uint8)))
    img.alpha_composite(p, (x0, y0))

def erase_old_patches(img, centres, win=45):
    """Inpaint the model-drawn patches away (filled ring found by hole-filling the dark ring)."""
    import cv2
    from scipy import ndimage
    rgb = np.array(img.convert("RGB")); g = np.array(img.convert("L")).astype(int)
    mask = np.zeros(g.shape, np.uint8)
    for x, y in centres:
        w = g[y - win:y + win, x - win:x + win]; dark = w < 110
        fill = ndimage.binary_fill_holes(dark); inter = fill & ~dark
        lab, n = ndimage.label(inter); k = np.argmax(ndimage.sum(inter, lab, range(1, n + 1))) + 1
        m = ndimage.binary_dilation(lab == k, iterations=6) & ndimage.binary_dilation(fill, iterations=1)
        mask[y - win:y + win, x - win:x + win] |= ndimage.binary_dilation(m, iterations=1).astype(np.uint8)
    out = cv2.inpaint(rgb, mask * 255, 5, cv2.INPAINT_TELEA)
    img.paste(Image.fromarray(out))

def back_lettering(img, dot_box, erase_box, src_dy):
    x0, y0, x1, y1 = dot_box; D = x1 - x0; cx = (x0 + x1) / 2
    ex0, ey0, ex1, ey1 = erase_box   # paint out the model's lettering with jacket texture from just below
    img.paste(img.crop((ex0, ey0 + src_dy, ex1, ey1 + src_dy)), (ex0, ey0))
    L = Image.open(ART + "back_rare_earth_lettering.png").convert("RGBA")
    bb = L.getbbox(); L = L.crop(bb)
    lw = D * 7.5 / 7.75; lh = D * 0.701 / 7.75
    L = L.resize((max(int(round(lw * 3)), 1), max(int(round(lh * 3)), 1)), Image.LANCZOS).resize((int(round(lw)), int(round(lh))), Image.LANCZOS)
    a = np.array(L).astype(float); a[..., :3] = [0x27, 0x27, 0x29]; L = Image.fromarray(a.astype(np.uint8))
    top = y1 + D * 1.0 / 7.75
    img.alpha_composite(L, (int(round(cx - L.width / 2)), int(round(top))))

if __name__ == "__main__" and len(sys.argv) == 1:
    src = V + "assets/sheets/raw/jade2_turn_gpt_e.png"
    img = Image.open(src).convert("RGBA")
    erase_old_patches(img, [(333, 309), (665, 307), (934, 307)])
    from PIL import ImageDraw
    lay = Image.new("RGBA", (img.width * 4, img.height * 4), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)   # restore the arm outline (antialiased)
    for (xa, ya), (xb, yb) in [((337, 284), (347.5, 331)), ((678.5, 282), (686.5, 327))]:
        d.line((xa * 4, ya * 4, xb * 4, yb * 4), fill=(38, 36, 36, 235), width=6)
    img.alpha_composite(lay.resize(img.size, Image.LANCZOS))
    patch(img, 330, 310, 26, 46, clip_line=((337, 284), (347.5, 331)))     # front (foreshortened on the arm)
    patch(img, 663, 308, 34, 47, clip_line=((678.5, 282), (686.5, 327)))   # three-quarter
    patch(img, 935, 307, 46, 51)                                            # side
    back_lettering(img, (1244, 237, 1332, 326), (1236, 334, 1342, 353), 19)  # back
    out = img.convert("RGB")
    out.save(V + "assets/sheets/paper/paper_jade_turnaround.png")
    out.resize((out.width * 2, out.height * 2), Image.LANCZOS).save(V + "assets/sheets/paper/paper_jade_turnaround_2x.png")
    print("ok")

def fix_patch_auto(img, x, y, win=60, grow=2):
    """Find the model-drawn patch ring near (x, y), inpaint it away and put the real artwork in its bbox."""
    from scipy import ndimage
    g = np.array(img.convert("L")).astype(int)
    w = g[y - win:y + win, x - win:x + win]; dark = w < 110
    fill = ndimage.binary_fill_holes(dark); inter = fill & ~dark
    lab, n = ndimage.label(inter); k = np.argmax(ndimage.sum(inter, lab, range(1, n + 1))) + 1
    full = ndimage.binary_dilation(lab == k, iterations=6) & fill
    ys, xs = np.nonzero(full)
    x0, y0, x1, y1 = xs.min() + x - win, ys.min() + y - win, xs.max() + x - win, ys.max() + y - win
    erase_old_patches(img, [((x0 + x1) // 2, (y0 + y1) // 2)], win)
    patch(img, (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0 + 2 * grow, y1 - y0 + 2 * grow)
    return (x0, y0, x1, y1)

def lineup():
    img = Image.open(V + "assets/sheets/raw/jade2_lineup_nbp_a.png").convert("RGBA")
    import cv2
    x0, y0, x1, y1 = 686, 481, 724, 544          # model-drawn patch ring (measured)
    m = Image.new("L", img.size, 0); from PIL import ImageDraw
    ImageDraw.Draw(m).ellipse((x0 - 3, y0 - 3, x1 + 3, y1 + 3), fill=255)
    out = cv2.inpaint(np.array(img.convert("RGB")), np.array(m), 5, cv2.INPAINT_TELEA); img.paste(Image.fromarray(out))
    patch(img, (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0 + 4, y1 - y0 + 4)
    img.convert("RGB").save(V + "assets/sheets/paper/paper_lineup.png")

if __name__ == "__main__" and len(sys.argv) > 1 and sys.argv[1] == "lineup":
    lineup(); sys.exit()
