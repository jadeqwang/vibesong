"""Procedural layouts handed to the models (glyphs placed by us so the strokes are exact)."""
import random, json, os
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import hz
from common import W

L = os.path.join(W, "layout"); os.makedirs(L, exist_ok=True)
CREAM = (242, 234, 214)
GRAPH = (74, 74, 80)
GRAPH_HI = (154, 154, 162)


def paper(w, h, px=4, seed=1):
    rnd = random.Random(seed)
    im = Image.new("RGB", (w // px, h // px), CREAM)
    p = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if (x + y) % 2 == 0 and rnd.random() < 0.18:
                p[x, y] = (232, 222, 200)
    return im.resize((w, h), Image.NEAREST)


def graphite_platform(mask, px=5, grow=9):
    """mask L -> RGBA graphite pixel platform (pixelated, highlight on top edge)."""
    m = mask.filter(ImageFilter.MaxFilter(grow)) if grow else mask
    sm = m.resize((m.width // px, m.height // px), Image.BOX).point(lambda v: 255 if v > 100 else 0)
    w, h = sm.size
    rgba = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sp, rp = sm.load(), rgba.load()
    rnd = random.Random(3)
    for y in range(h):
        for x in range(w):
            if sp[x, y]:
                top = y == 0 or not sp[x, y - 1]
                bot = y == h - 1 or not sp[x, y + 1]
                c = GRAPH_HI if top else ((50, 50, 56) if bot else GRAPH)
                if not top and not bot and rnd.random() < 0.15:
                    c = (88, 88, 95)
                rp[x, y] = c + (255,)
    return rgba.resize((w * px, h * px), Image.NEAREST)


def k01():
    Wd, Ht = 1536, 1024
    im = paper(Wd, Ht)
    S = 350
    pos = [(20, 400), (390, 290), (760, 370), (1150, 250)]
    meta = {}
    for i, (ch, (x, y)) in enumerate(zip("一笔一画", pos)):
        if i < 3:
            m = hz.glyph_mask(ch, S)
        else:
            m = hz.glyph_mask(ch, S, 7, 0.55)
            tip = hz.stroke_tip(ch, 6, S, 0.55)
            meta["tip"] = (x + tip[0], y + tip[1])
        plat = graphite_platform(m)
        im.paste(plat, (x, y), plat)
    im.save(os.path.join(L, "k01.png"))
    json.dump(meta, open(os.path.join(L, "k01.json"), "w"))
    print("k01 tip", meta)


def k05():
    """VOID: 说出来 / 它就存在 as chunky pixel platforms, rising left->right."""
    Wd, Ht = 1536, 1024
    im = Image.new("RGB", (Wd, Ht), (6, 8, 16))
    f = hz.font("NotoSansSC-Black.otf", 172)
    words = [("说", 70, 620), ("出", 260, 575), ("来", 450, 620), ("它", 730, 470), ("就", 920, 420), ("存", 1110, 470), ("在", 1300, 420)]
    placed = []
    for ch, x, y in words:
        m = hz.text_mask(ch, f, pad=6)
        plat = block_glyph(m)
        im.paste(plat, (x, y), plat)
        placed.append((ch, x, y, plat.width, plat.height))
    im.save(os.path.join(L, "k05.png"))
    json.dump(placed, open(os.path.join(L, "k05.json"), "w"), ensure_ascii=False)


def block_glyph(m, px=5, depth=4, face=(236, 244, 255), side=(70, 110, 200), edge=(150, 200, 255)):
    """Glyph mask -> pixel 'extruded block' RGBA (face + side extrusion down-right)."""
    sm = m.resize((m.width // px, m.height // px), Image.BOX).point(lambda v: 255 if v > 90 else 0)
    w, h = sm.size
    out = Image.new("RGBA", (w + depth, h + depth), (0, 0, 0, 0))
    for d in range(depth, 0, -1):
        out.paste(Image.new("RGBA", sm.size, side + (255,)), (d, d), sm)
    out.paste(Image.new("RGBA", sm.size, face + (255,)), (0, 0), sm)
    # top-edge highlight
    sp = sm.load(); op = out.load()
    for y in range(h):
        for x in range(w):
            if sp[x, y] and (y == 0 or not sp[x, y - 1]):
                op[x, y] = edge + (255,)
    return out.resize((out.width * px, out.height * px), Image.NEAREST)




def k11():
    """Guide: colossal 画 floating in an erased dusk world, fragments + trails."""
    Wd, Ht = 1920, 1080
    im = Image.new("RGB", (Wd, Ht))
    d = ImageDraw.Draw(im)
    for y in range(Ht):
        t = y / Ht
        c = (int(40 + 170 * t), int(40 + 120 * t), int(90 + 90 * t)) if y < 640 else (225, 222, 215)
        d.line([(0, y), (Wd, y)], fill=c)
    S = 760
    m = hz.glyph_mask("画", S).filter(ImageFilter.MaxFilter(7))
    x0, y0 = 700, 40
    rb = hz.rainbow_fast(S, S, angle=0.8)
    im.paste(rb, (x0, y0), m)
    im.save(os.path.join(L, "k11.png"))
    json.dump({"x0": x0, "y0": y0, "S": S}, open(os.path.join(L, "k11.json"), "w"))


def k12():
    """Guide: top-down map, 一笔一画 as colossal rainbow landforms."""
    Wd, Ht = 1920, 1080
    im = Image.new("RGB", (Wd, Ht), (120, 170, 110))
    S = 520
    pos = [(-30, 300), (430, 260), (900, 300), (1380, 260)]
    import colorsys
    k = 0
    tot = sum(hz.n_strokes(c) for c in "一笔一画")
    for ch, (x, y) in zip("一笔一画", pos):
        for s in range(hz.n_strokes(ch)):
            m = hz.stroke_mask(ch, s, S).filter(ImageFilter.MaxFilter(9))
            r, g, b = colorsys.hsv_to_rgb(k / tot, 0.75, 0.95); k += 1
            im.paste((int(r * 255), int(g * 255), int(b * 255)), (x, y), m)
    im.save(os.path.join(L, "k12.png"))
    json.dump({"pos": pos, "S": S}, open(os.path.join(L, "k12.json"), "w"))


if __name__ == "__main__":
    import sys
    for k in sys.argv[1:]:
        globals()[k]()
