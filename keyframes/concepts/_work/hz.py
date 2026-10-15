"""Procedural text/glyph helpers for the concept keyframes (Make Me a Hanzi strokes + OFL fonts)."""
import json, os, re, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "fonts")
GRAPHICS = "/home/jade/Documents/vibesong/engine/data/graphics.txt"
_DB = {}


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def load(ch):
    if ch not in _DB:
        with open(GRAPHICS, encoding="utf-8") as f:
            for line in f:
                if line.startswith('{"character":"%s"' % ch):
                    _DB[ch] = json.loads(line)
                    break
    return _DB[ch]


def _flatten(d, steps=12):
    toks = re.findall(r"[MLQCZ]|-?\d+(?:\.\d+)?", d)
    polys, cur, pt, i, cmd = [], [], (0, 0), 0, None
    while i < len(toks):
        t = toks[i]
        if t in "MLQCZ":
            cmd = t; i += 1
            if t == "Z":
                if cur: polys.append(cur); cur = []
                continue
        n = lambda k: float(toks[i + k])
        if cmd == "M":
            if cur: polys.append(cur)
            pt = (n(0), n(1)); cur = [pt]; i += 2
        elif cmd == "L":
            pt = (n(0), n(1)); cur.append(pt); i += 2
        elif cmd == "Q":
            c, e = (n(0), n(1)), (n(2), n(3))
            for s in range(1, steps + 1):
                u = s / steps
                cur.append(((1-u)**2*pt[0]+2*(1-u)*u*c[0]+u*u*e[0], (1-u)**2*pt[1]+2*(1-u)*u*c[1]+u*u*e[1]))
            pt = e; i += 4
        elif cmd == "C":
            c1, c2, e = (n(0), n(1)), (n(2), n(3)), (n(4), n(5))
            for s in range(1, steps + 1):
                u = s / steps; a, b, cc, dd = (1-u)**3, 3*(1-u)**2*u, 3*(1-u)*u*u, u**3
                cur.append((a*pt[0]+b*c1[0]+cc*c2[0]+dd*e[0], a*pt[1]+b*c1[1]+cc*c2[1]+dd*e[1]))
            pt = e; i += 6
        else:
            i += 1
    if cur: polys.append(cur)
    return polys


def _tx(p, size, ox=0, oy=0, ss=1):
    s = size / 1024.0
    return ((p[0] * s + ox) * ss, ((900 - p[1]) * s + oy) * ss)


def stroke_mask(ch, k, size, partial=1.0, ss=4):
    """Mask (L, size x size) of stroke k of ch; partial<1 reveals it along its median (brush order)."""
    g = load(ch)
    big = Image.new("L", (size * ss, size * ss), 0)
    d = ImageDraw.Draw(big)
    for poly in _flatten(g["strokes"][k]):
        d.polygon([_tx(p, size, ss=ss) for p in poly], fill=255)
    if partial < 1.0:
        med = [_tx(p, size, ss=ss) for p in g["medians"][k]]
        segs = [math.dist(med[j], med[j + 1]) for j in range(len(med) - 1)]
        L = sum(segs) * partial
        rev = Image.new("L", big.size, 0); rd = ImageDraw.Draw(rev)
        r = size * ss * 0.075
        acc = 0
        for j, sl in enumerate(segs):
            a, b = med[j], med[j + 1]
            nstep = max(2, int(sl / (r * 0.3)))
            for s in range(nstep + 1):
                if acc + sl * s / nstep > L: break
                x = a[0] + (b[0] - a[0]) * s / nstep; y = a[1] + (b[1] - a[1]) * s / nstep
                rd.ellipse([x - r, y - r, x + r, y + r], fill=255)
            acc += sl
            if acc > L: break
        big = ImageChops.multiply(big, rev)
    return big.resize((size, size), Image.LANCZOS)


def stroke_tip(ch, k, size, partial):
    """Pixel position (in glyph box of `size`) of the brush tip at `partial` along stroke k."""
    g = load(ch)
    med = [_tx(p, size) for p in g["medians"][k]]
    segs = [math.dist(med[j], med[j + 1]) for j in range(len(med) - 1)]
    L = sum(segs) * partial; acc = 0
    for j, sl in enumerate(segs):
        if acc + sl >= L:
            u = (L - acc) / sl if sl else 0
            return (med[j][0] + (med[j + 1][0] - med[j][0]) * u, med[j][1] + (med[j + 1][1] - med[j][1]) * u)
        acc += sl
    return med[-1]


def glyph_mask(ch, size, n_strokes=None, last_partial=1.0):
    g = load(ch)
    n = len(g["strokes"]) if n_strokes is None else n_strokes
    m = Image.new("L", (size, size), 0)
    for k in range(n):
        part = last_partial if k == n - 1 else 1.0
        m = ImageChops.lighter(m, stroke_mask(ch, k, size, part))
    return m


def n_strokes(ch):
    return len(load(ch)["strokes"])


def text_mask(txt, fnt, pad=0, stroke=0):
    bb = fnt.getbbox(txt, stroke_width=stroke)
    w, h = bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).text((pad - bb[0], pad - bb[1]), txt, font=fnt, fill=255, stroke_width=stroke, stroke_fill=255)
    return m


def pixelate(img, px):
    w, h = img.size
    return img.resize((max(1, w // px), max(1, h // px)), Image.BOX).resize((w, h), Image.NEAREST)


def pixel_text(txt, fnt_name, size_small, px, fill, shadow=None, outline=None):
    """Render txt at small size, hard threshold, nearest-upscale by px -> RGBA."""
    f = font(fnt_name, size_small)
    m = text_mask(txt, f, pad=2)
    m = m.point(lambda v: 255 if v > 110 else 0)
    w, h = m.size
    out = Image.new("RGBA", (w + 2, h + 2), (0, 0, 0, 0))
    if outline:
        o = m.filter(ImageFilter.MaxFilter(3))
        out.paste(Image.new("RGBA", m.size, outline), (0, 0), o); out.paste(Image.new("RGBA", m.size, outline), (2, 2), o)
    if shadow:
        out.paste(Image.new("RGBA", m.size, shadow), (2, 2), m)
    out.paste(Image.new("RGBA", m.size, fill), (0, 0), m)
    return out.resize((out.width * px, out.height * px), Image.NEAREST)


def rainbow(w, h, angle=0.0, sat=0.85, val=1.0, phase=0.0):
    import colorsys
    im = Image.new("RGB", (w, h))
    px = im.load()
    ca, sa = math.cos(angle), math.sin(angle)
    span = abs(w * ca) + abs(h * sa) or 1
    for y in range(h):
        for x in range(w):
            t = ((x * ca + y * sa) / span + phase) % 1.0
            r, g, b = colorsys.hsv_to_rgb(t, sat, val)
            px[x, y] = (int(r * 255), int(g * 255), int(b * 255))
    return im


def rainbow_fast(w, h, angle=0.0, sat=0.85, val=1.0, phase=0.0):
    sw, sh = max(2, w // 8), max(2, h // 8)
    return rainbow(sw, sh, angle, sat, val, phase).resize((w, h), Image.BILINEAR)


def crop169(path_in, path_out=None, center=0.5, W=1920, H=1080):
    im = Image.open(path_in).convert("RGB")
    w, h = im.size
    th = int(round(w * 9 / 16))
    if th <= h:
        y0 = int((h - th) * center); im = im.crop((0, y0, w, y0 + th))
    else:
        tw = int(round(h * 16 / 9)); x0 = (w - tw) // 2; im = im.crop((x0, 0, x0 + tw, h))
    im = im.resize((W, H), Image.LANCZOS)
    if path_out: im.save(path_out)
    return im
