"""Composite procedural text onto the raw generations -> final 1920x1080 concept keyframes."""
import os, sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops, ImageEnhance
import hz
from common import W, CONC

RAW = os.path.join(W, "raw")
OUT = CONC
PS = os.path.join(hz.FONTS, "PressStart2P-Regular.ttf")


def ptext(txt, scale, fill, outline=None, shadow=None, sh_off=1, size=8, fnt=PS):
    """Pixel text: render at native 8px without AA, optional 1px outline/shadow, nearest-upscale."""
    f = ImageFont.truetype(fnt, size)
    bb = f.getbbox(txt)
    w, h = bb[2] - bb[0] + 4, bb[3] - bb[1] + 4
    m = Image.new("1", (w, h), 0)
    d = ImageDraw.Draw(m); d.fontmode = "1"
    d.text((2 - bb[0], 2 - bb[1]), txt, font=f, fill=1)
    m = m.convert("L")
    out = Image.new("RGBA", (w + sh_off, h + sh_off), (0, 0, 0, 0))
    if outline:
        o = m.filter(ImageFilter.MaxFilter(3))
        out.paste(Image.new("RGBA", m.size, outline), (0, 0), o)
        if shadow:
            out.paste(Image.new("RGBA", m.size, shadow), (sh_off, sh_off), o)
            out.paste(Image.new("RGBA", m.size, outline), (0, 0), o)
    elif shadow:
        out.paste(Image.new("RGBA", m.size, shadow), (sh_off, sh_off), m)
    if isinstance(fill, Image.Image):
        out.paste(fill.resize(m.size, Image.NEAREST).convert("RGBA"), (0, 0), m)
    else:
        out.paste(Image.new("RGBA", m.size, fill), (0, 0), m)
    return out.resize((out.width * scale, out.height * scale), Image.NEAREST)


def put(base, layer, xy, anchor="lt"):
    x, y = xy
    if anchor[0] == "m": x -= layer.width // 2
    if anchor[0] == "r": x -= layer.width
    if anchor[1] == "m": y -= layer.height // 2
    if anchor[1] == "b": y -= layer.height
    base.alpha_composite(layer, (int(x), int(y)))


def crop(name, center=0.5):
    return hz.crop169(os.path.join(RAW, name), center=center).convert("RGBA")


def save(im, key):
    p = os.path.join(OUT, key + ".png")
    im.convert("RGB").save(p, optimize=True)
    print("saved", p)


# --------------------------------------------------------------------------------------------- frames
def k01(src="k01_v1.png"):
    im = crop(src, 0.5)
    save(im, "k01_cold_open")


def k02(src="k02_v1.png"):
    im = crop(src, 0.5)
    # big chunky stamp: Bungee rendered small, hard-thresholded, nearest-up (pixel look), tilted
    f = hz.font("Bungee-Regular.ttf", 46)
    m = hz.text_mask("RUN IT!", f, pad=6).point(lambda v: 255 if v > 120 else 0)
    m = m.rotate(4, resample=Image.NEAREST, expand=True)
    w, h = m.size
    o1 = m.filter(ImageFilter.MaxFilter(5))
    o2 = o1.filter(ImageFilter.MaxFilter(3))
    lay = Image.new("RGBA", (w + 6, h + 6), (0, 0, 0, 0))
    lay.paste(Image.new("RGBA", o2.size, (10, 20, 60, 255)), (4, 5), o2)       # drop shadow
    lay.paste(Image.new("RGBA", o2.size, (255, 255, 255, 255)), (0, 0), o2)    # white rim
    lay.paste(Image.new("RGBA", o1.size, (14, 32, 92, 255)), (0, 0), o1)      # navy outline
    # fill: vertical cyan->electric blue bands (16-bit gradient banding)
    fill = Image.new("RGBA", m.size)
    fd = ImageDraw.Draw(fill)
    bands = [(220, 250, 255), (150, 230, 255), (80, 200, 255), (40, 150, 250), (30, 100, 230)]
    for i, c in enumerate(bands):
        fd.rectangle([0, i * h // len(bands), w, (i + 1) * h // len(bands)], fill=c + (255,))
    lay.paste(fill, (0, 0), m)
    # 1px highlight line across the top of the letters
    hi = ImageChops.subtract(m, m.transform(m.size, Image.AFFINE, (1, 0, 0, 0, 1, -2)))
    lay.paste(Image.new("RGBA", m.size, (255, 255, 255, 255)), (0, 0), hi)
    lay = lay.resize((lay.width * 7, lay.height * 7), Image.NEAREST)
    put(im, lay, (900, 300), "mm")
    save(im, "k02_run_it")


def k03(src="k03_v1.png"):
    raw = Image.open(os.path.join(RAW, src)).convert("RGB")
    s = 1080 / 1024
    sc = raw.resize((round(1536 * s), 1080), Image.LANCZOS)
    pad = (1920 - sc.width) // 2
    im = Image.new("RGB", (1920, 1080))
    im.paste(sc, (pad, 0))
    # fill side pads with the stone wall: mirrored edge strip, torch rows replaced by lower bricks
    for side in ("L", "R"):
        strip = sc.crop((0, 0, pad, 1080)) if side == "L" else sc.crop((sc.width - pad, 0, sc.width, 1080))
        strip = strip.transpose(Image.FLIP_LEFT_RIGHT)
        clean = strip.crop((0, 470, pad, 1080))
        col = Image.new("RGB", (pad, 1080))
        y = 1080
        while y > 0:
            y -= clean.height
            col.paste(clean, (0, y))
        col = ImageEnhance.Brightness(col).enhance(0.8)
        im.paste(col, (0, 0) if side == "L" else (1920 - pad, 0))
    im = im.convert("RGBA")
    X = lambda x: x * s + pad
    Y = lambda y: y * s
    gold, white, yel, dim = (255, 214, 96, 255), (245, 245, 250, 255), (255, 236, 80, 255), (190, 200, 230, 255)
    put(im, ptext("CHOOSE YOUR PARTY", 4, gold, shadow=(40, 20, 0, 255)), (X(768), Y(68)), "mm")
    cards = [
        (350, "CHARLIE", ["SINGER-SONGWRITER", "GUITARIST", "TECH DEMOS"], "ITEM: HAT"),
        (768, "JADE", ["MUSICIAN", "SCIENTIST · POET", "MARTIAL ARTIST"], "ITEM: 2 PENCILS"),
        (1186, "RICKY", ["ELECTRIC GUITAR", "HACKER", "PM EXTRAORDINAIRE"], "ITEM: GUITAR"),
    ]
    for cx, name, bio, item in cards:
        put(im, ptext(name, 4, yel if name == "JADE" else white, shadow=(0, 0, 0, 255)), (X(cx), Y(598)), "mm")
        lines = bio + [item]
        for i, ln in enumerate(lines):
            put(im, ptext(ln, 2, gold if ln.startswith("ITEM") else dim, shadow=(0, 0, 0, 255)),
                (X(cx), Y(776) + 2 + i * 18), "mt")
    put(im, ptext('SAVE FILE FOUND: 2011 · "FIXTURES & FUNCTIONS" · CONTINUE?', 2, (120, 255, 140, 255),
                  shadow=(0, 40, 0, 255)), (X(768), Y(918)), "mm")
    # blinking 1P cursor arrow over Jade
    put(im, ptext("▼ 1P", 3, yel, shadow=(0, 0, 0, 255)), (X(768), Y(128)), "mm")
    # canon pass: Jade portrait patch (hair up, X pencils) + canon item icons
    pp = os.path.join(W, "patches", "k03.png")
    if os.path.exists(pp):
        im.alpha_composite(Image.open(pp).convert("RGBA"))
    for (x0, y0, x1, y1), cap, lead in (((772, 685, 886, 796), (255, 120, 140), "graphite"),
                                        ((905, 685, 1019, 796), (60, 120, 255), "rainbow")):
        ImageDraw.Draw(im).rectangle([x0, y0, x1, y1], fill=(14, 16, 30, 255))
        icon = pencil_icon(cap, lead)
        put(im, icon, ((x0 + x1) // 2, (y0 + y1) // 2), "mm")
    save(im, "k03_character_select")


def pencil_icon(cap, lead, n=26, px=4):
    """Pixel-art yellow pencil, diagonal (tip lower-left, cap upper-right)."""
    g = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    p = g.load()
    rb = [(255, 60, 60), (255, 160, 40), (250, 230, 50), (60, 200, 80), (60, 140, 255), (170, 80, 230)]
    def body(t):  # t: 0 tip .. n cap along the diagonal
        if t < 2: return "lead"
        if t < 5: return (236, 196, 140)
        if t < 19: return (250, 196, 40) if True else None
        if t < 20: return (170, 170, 180)
        return cap
    for t in range(0, 23):
        cx, cy = 2 + t, n - 3 - t
        w = 0 if t < 2 else (1 if t < 4 else 2)
        for o in range(-w, w + 1):
            for x, y in ((cx + o, cy + o), (cx + o + 1, cy + o)):
                if 0 <= x < n and 0 <= y < n:
                    c = body(t)
                    if c == "lead":
                        c = (60, 60, 66) if lead == "graphite" else rb[(t + o + 3) % 6]
                    elif c == (250, 196, 40) and o == -w:
                        c = (255, 226, 110)
                    elif c == (250, 196, 40) and o == w:
                        c = (214, 150, 20)
                    p[x, y] = c + (255,)
    a = g.split()[3]
    ol = a.filter(ImageFilter.MaxFilter(3))
    out = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    out.paste(Image.new("RGBA", (n, n), (8, 8, 12, 255)), (0, 0), ol)
    out.alpha_composite(g)
    return out.resize((n * px, n * px), Image.NEAREST)


def k04(src="k04_v1.png"):
    y0 = 160
    im = crop(src, 1.0)
    T = lambda x, y: (x * 1.25, (y - y0) * 1.25)
    blue = (28, 78, 220, 255)
    lab = ptext("linked", 4, blue, shadow=None)
    # underline (hyperlink)
    d = ImageDraw.Draw(lab)
    d.rectangle([0, lab.height - 6, lab.width - 4, lab.height - 2], fill=blue)
    put(im, lab, (1055, 208), "mb")
    # a tiny pixel hand-cursor feel: arrow
    put(im, ptext("LINES OF CODE:", 2, (200, 200, 205, 255)), (1612, 942), "mt")
    put(im, ptext("0", 4, (255, 90, 60, 255), shadow=(60, 0, 0, 255)), (1612, 972), "mt")
    save(im, "k04_kaizo_eraser")


def k05(src="k05_v1.png"):
    im = crop(src, 0.5)
    box = Image.new("RGBA", (760, 92), (0, 0, 0, 200))
    ImageDraw.Draw(box).rectangle([0, 0, 759, 91], outline=(255, 60, 60, 255), width=4)
    put(im, box, (960, 70), "mm")
    put(im, ptext("! LEVEL NOT FOUND !", 4, (255, 70, 70, 255), shadow=(70, 0, 0, 255)), (960, 72), "mm")
    sub = ptext("say it out loud, and it exists", 3, (255, 255, 255, 255))
    bg = Image.new("RGBA", (sub.width + 40, sub.height + 24), (0, 0, 0, 215))
    put(im, bg, (960, 1022), "mm"); put(im, sub, (960, 1022), "mm")
    save(im, "k05_void")


def k06(src="k06_v1_fix.png"):
    im = crop(src, 0.5)
    T = lambda x, y: (x * 1.25, (y - 80) * 1.25)
    # FIXTURES carved into the gray slab: dark recess + light lower lip
    f = ptext("FIXTURES", 9, (70, 70, 78, 255))
    hi = ptext("FIXTURES", 9, (215, 215, 222, 255))
    cx, cy = T(355, 830)
    put(im, hi, (cx + 5, cy + 5), "mm"); put(im, f, (cx, cy), "mm")
    # FUNCTIONS in rainbow on the bright slab
    rb = hz.rainbow_fast(80, 12, angle=0.0)
    fn = ptext("FUNCTIONS", 9, rb, outline=(255, 255, 255, 255), shadow=(60, 20, 0, 255), sh_off=1)
    put(im, fn, T(1188, 830), "mm")
    save(im, "k06_fixtures_functions")




def full(src):
    return Image.open(os.path.join(RAW, src)).convert("RGB").resize((1920, 1080), Image.LANCZOS).convert("RGBA")


def sans(size, weight="SemiBold"):
    f = ImageFont.truetype(os.path.join(hz.FONTS, "SourceSans3.ttf"), size)
    f.set_variation_by_name(weight)
    return f


def subtitle(im, txt, cy, size=40, fill=(255, 255, 255, 255)):
    f = sans(size)
    m = hz.text_mask(txt, f, pad=12)
    sh = m.filter(ImageFilter.GaussianBlur(6))
    lay = Image.new("RGBA", m.size, (0, 0, 0, 0))
    lay.paste(Image.new("RGBA", m.size, (0, 0, 0, 170)), (0, 0), sh)
    lay.paste(Image.new("RGBA", m.size, fill), (0, 0), m)
    put(im, lay, (960, cy), "mm")


def bulbs(txt, fnt, spacing=9, r=3.2, color=(255, 214, 140)):
    """Marquee light-bulb lettering: dots sampled on a grid inside the glyph mask, with glow."""
    m = hz.text_mask(txt, fnt, pad=30)
    w, h = m.size
    dots = Image.new("L", m.size, 0)
    d = ImageDraw.Draw(dots)
    mp = m.load()
    for y in range(0, h, spacing):
        for x in range(0, w, spacing):
            if mp[x, y] > 160:
                d.ellipse([x - r, y - r, x + r, y + r], fill=255)
    glow = dots.filter(ImageFilter.GaussianBlur(9))
    glow2 = m.filter(ImageFilter.GaussianBlur(16))
    lay = Image.new("RGBA", m.size, (0, 0, 0, 0))
    lay.paste(Image.new("RGBA", m.size, color + (255,)), (0, 0), glow2.point(lambda v: int(v * 0.45)))
    lay.paste(Image.new("RGBA", m.size, color + (255,)), (0, 0), glow.point(lambda v: min(255, v * 2)))
    lay.paste(Image.new("RGBA", m.size, (255, 250, 235, 255)), (0, 0), dots)
    return lay


def k07(src="k07c_v1.png"):
    im = full(src)
    save(im, "k07_the_turn_plaster")


def k08(src="k08_v1.png"):
    im = full(src)
    f = hz.font("NotoSansSC-Black.otf", 62)
    m = hz.text_mask("世界 是我的舞台", f, pad=30)
    lay = Image.new("RGBA", m.size, (0, 0, 0, 0))
    lay.paste(Image.new("RGBA", m.size, (255, 190, 110, 255)), (0, 0), m.filter(ImageFilter.GaussianBlur(14)).point(lambda v: int(v * 0.7)))
    lay.paste(Image.new("RGBA", m.size, (255, 220, 160, 255)), (0, 0), m.filter(ImageFilter.GaussianBlur(4)))
    core = Image.new("RGBA", m.size, (255, 248, 230, 255))
    dots = Image.new("L", m.size, 255); dd = ImageDraw.Draw(dots)
    for yy in range(0, m.height, 7):
        dd.line([(0, yy), (m.width, yy)], fill=200)
    lay.paste(core, (0, 0), ImageChops.multiply(m, dots))
    put(im, lay, (1246, 280), "mm")
    subtitle(im, "the world is my stage", 1010)
    save(im, "k08_world_is_my_stage")


def k09(src="k09b_v1.png"):
    im = full(src)
    save(im, "k09_bug_dance_paint_flood")


def _persp_coeffs(dst, src):
    A, B = [], []
    for (x, y), (u, v) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); B.append(v)
    return np.linalg.solve(np.array(A, float), np.array(B, float)).tolist()


def k10(src="k10_v1.png"):
    im = full(src)
    # code written on the BACK of the backlit sheet: shows through mirror-reversed, faint graphite
    CW, CH = 740, 1100
    code = Image.new("L", (CW, CH), 0)
    d = ImageDraw.Draw(code)
    f = hz.font("LXGWWenKai-Medium.ttf", 46)
    lines = ["function draw(world) {", "  for (const s of strokes) {", "    world.add(s);  // fixtures",
             "    s.color();     // functions", "  }", "  return world;", "}", "", "// 是一幅画", "// 也是一段代码"]
    for i, ln in enumerate(lines):
        d.text((30, 60 + i * 96), ln, font=f, fill=255)
    code = code.transpose(Image.FLIP_LEFT_RIGHT)
    quad = [(1138, 213), (1509, 252), (1382, 768), (1056, 776)]
    coeffs = _persp_coeffs(quad, [(0, 0), (CW, 0), (CW, CH), (0, CH)])
    warped = code.transform((1920, 1080), Image.PERSPECTIVE, coeffs, Image.BICUBIC)
    a = np.asarray(im.convert("RGB")).astype(int)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    luma = 0.3 * R + 0.59 * G + 0.11 * B
    skin = (R > G) & (G > B) & ((R - B) > 50) & (luma < 215)
    keep = Image.fromarray(np.where(skin, 0, 255).astype("uint8")).filter(ImageFilter.MinFilter(5))
    wm = ImageChops.multiply(warped, keep).filter(ImageFilter.GaussianBlur(0.8)).point(lambda v: int(v * 0.5))
    im.paste(Image.new("RGBA", im.size, (70, 66, 80, 255)), (0, 0), wm)
    # handwritten pencil subtitle, lots of air
    zh = hz.font("LXGWWenKai-Medium.ttf", 44)
    en = ImageFont.truetype(os.path.join(hz.FONTS, "Caveat[wght].ttf"), 40)
    d2 = ImageDraw.Draw(im)
    d2.text((272, 880), "是一幅画  也是一段代码", font=zh, fill=(80, 76, 88, 235), anchor="mm")
    d2.text((272, 940), "it's a painting, and it's also code", font=en, fill=(96, 90, 104, 225), anchor="mm")
    save(im, "k10_bridge_paper")


def k11(src="k11_v1.png"):
    save(full(src), "k11_perspective_lock")


def k12(src="k12_v1.png"):
    save(full(src), "k12_aerial_yibiyihua")


def k10b(src="k10b_1920.png"):
    im = Image.open(os.path.join(W, src)).convert("RGBA")
    tri = [(1465, 276), (1205, 516), (1431, 500)]
    lay = Image.new("L", im.size, 0)
    d = ImageDraw.Draw(lay)
    f = hz.font("LXGWWenKai-Medium.ttf", 23)
    lines = [(366, "draw() {"), (396, " fixtures();"), (426, " functions();"), (456, " return world;"), (488, "} // 也是一段代码")]
    for y, t in lines:
        xl = 1205 + (516 - y) * 260 / 240 + 8
        d.text((xl, y), t, font=f, fill=255, anchor="ls")
    lay = lay.rotate(3.8, center=(1330, 470), resample=Image.BICUBIC)
    clip = Image.new("L", im.size, 0); ImageDraw.Draw(clip).polygon(tri, fill=255)
    clip = clip.filter(ImageFilter.MinFilter(7))
    ink = ImageChops.multiply(lay, clip).point(lambda v: int(v * 0.85))
    im.paste(Image.new("RGBA", im.size, (62, 60, 70, 255)), (0, 0), ink)
    zh = hz.font("LXGWWenKai-Medium.ttf", 38)
    en = ImageFont.truetype(os.path.join(hz.FONTS, "Caveat[wght].ttf"), 36)
    d2 = ImageDraw.Draw(im)
    d2.text((235, 905), "是一幅画  也是一段代码", font=zh, fill=(80, 76, 88, 235), anchor="mm")
    d2.text((235, 958), "it's a painting, and it's also code", font=en, fill=(96, 90, 104, 225), anchor="mm")
    save(im, "k10_bridge_paper")


def k08b(src="raw/k08b3_v1.png"):
    """Portal co-op; canon fix: rainbow core on the blue-cap pencil tip (recolour the dark tip pixels)."""
    import colorsys
    im = Image.open(os.path.join(W, src)).convert("RGB").resize((1920, 1080), Image.LANCZOS)
    px = im.load()
    for y in range(494, 512):
        for x in range(1464, 1484):
            r, g, b = px[x, y]
            if 0.3 * r + 0.59 * g + 0.11 * b < 95:
                h = ((x - 1464) * 0.6 + (y - 494)) / 20.0 % 1.0
                rr, gg, bb = colorsys.hsv_to_rgb(h, 0.85, 0.95)
                px[x, y] = (int(rr * 255), int(gg * 255), int(bb * 255))
    save(im.convert("RGBA"), "k08b_portal_coop")


def k10c(src="k10c_1920.png"):
    """Bridge PAPER (v3 face). Rainbow lead on the blue-cap pencil; code on the folded-back flap; pencil subtitles."""
    import colorsys
    im = Image.open(os.path.join(W, src)).convert("RGB")
    px = im.load()
    for y in range(303, 328):
        for x in range(1587, 1610):
            r, g, b = px[x, y]
            if 0.3 * r + 0.59 * g + 0.11 * b < 120:
                h = (((x - 1587) + (y - 303)) / 42.0) % 1.0
                rr, gg, bb = colorsys.hsv_to_rgb(h, 0.8, 0.95)
                px[x, y] = (int(rr * 255), int(gg * 255), int(bb * 255))
    im = im.convert("RGBA")
    tri = [(680, 338), (487, 632), (718, 610)]
    lay = Image.new("L", im.size, 0)
    d = ImageDraw.Draw(lay)
    f = hz.font("LXGWWenKai-Medium.ttf", 19)
    lines = [(462, "draw(){"), (494, " fixtures();"), (526, " functions();"), (558, " return world;"), (594, "} //也是代码")]
    for y, t in lines:
        xl = 487 + (632 - y) * 193 / 294 + 22
        d.text((xl, y), t, font=f, fill=255, anchor="ls")
    lay = lay.rotate(5.4, center=(600, 560), resample=Image.BICUBIC)
    clip = Image.new("L", im.size, 0); ImageDraw.Draw(clip).polygon(tri, fill=255)
    clip = clip.filter(ImageFilter.MinFilter(5))
    ink = ImageChops.multiply(lay, clip).point(lambda v: int(v * 0.85))
    im.paste(Image.new("RGBA", im.size, (62, 60, 70, 255)), (0, 0), ink)
    zh = hz.font("LXGWWenKai-Medium.ttf", 40)
    en = ImageFont.truetype(os.path.join(hz.FONTS, "Caveat[wght].ttf"), 38)
    d2 = ImageDraw.Draw(im)
    d2.text((250, 905), "是一幅画  也是一段代码", font=zh, fill=(80, 76, 88, 235), anchor="mm")
    d2.text((250, 960), "it's a painting, and it's also code", font=en, fill=(96, 90, 104, 225), anchor="mm")
    save(im, "k10_bridge_paper")


if __name__ == "__main__":
    for k in sys.argv[1:]:
        globals()[k]()
