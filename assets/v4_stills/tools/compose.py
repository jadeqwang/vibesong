#!/usr/bin/env python3
"""v4 Tier-2 stills: final 1920x1080 PNGs in assets/v4_stills/. Exact text is set here in code (never by the image model):
#01 slate, #02 the whole SAVE FILE screen (pixel UI drawn in code + the approved Jade sprite), #11 stamp/captions/dedication.
Other stills are the picked model frames, resized. Run: .venv/bin/python assets/v4_stills/tools/compose.py"""
import math, random, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
R = '/home/jade/Documents/vibesong/'; W_ = R + 'assets/v4_stills/work/'; OUT = R + 'assets/v4_stills/'
FONTS = R + 'engine/assets/fonts/'
KAI = FONTS + 'LXGWWenKai-Medium.ttf'; PS2P = FONTS + 'PressStart2P-Regular.ttf'; INTER = FONTS + 'Inter.ttf'
INK = (59, 58, 64)
W, H = 1920, 1080


def fit(p):
    return Image.open(p).convert('RGB').resize((W, H), Image.LANCZOS)


def hand(img, xy, text, size, color=INK, rot=-1.2, seed=3, alpha=0.92):
    """handwritten line (LXGW WenKai, the engine's hand font) with pencil grain, slight tilt."""
    f = ImageFont.truetype(KAI, size)
    bb = f.getbbox(text); w, h = bb[2] + size // 2, bb[3] + size // 2
    lay = Image.new('L', (w, h), 0); ImageDraw.Draw(lay).text((size // 4, size // 8), text, font=f, fill=255)
    rnd = np.random.default_rng(seed); a = np.asarray(lay, np.float32) / 255
    a *= np.clip(0.78 + 0.35 * rnd.random(a.shape), 0, 1)            # pencil tooth
    lay = Image.fromarray((a * 255 * alpha).astype(np.uint8)).rotate(rot, resample=Image.BICUBIC, expand=True)
    col = Image.new('RGB', lay.size, color)
    img.paste(col, xy, lay)
    return lay.size


def stamp(text_top, text_bot, w=600, h=200, red=(200, 50, 58), rot=-7, seed=5):
    """red rubber stamp in the style of paperkit.stampCanvas (double rounded border, Inter black, ink wear)."""
    s = 3; cv = Image.new('L', (w * s, h * s), 0); g = ImageDraw.Draw(cv)
    g.rounded_rectangle((12 * s, 12 * s, (w - 12) * s, (h - 12) * s), radius=26 * s, outline=255, width=12 * s)
    g.rounded_rectangle((30 * s, 30 * s, (w - 30) * s, (h - 30) * s), radius=16 * s, outline=255, width=4 * s)
    f1 = ImageFont.truetype(INTER, 54 * s)
    f2 = ImageFont.truetype(INTER, 40 * s)
    f1.set_variation_by_axes([32, 900]); f2.set_variation_by_axes([32, 800])   # Inter axes: opsz, wght
    for f, t, y in ((f1, text_top, 0.40), (f2, text_bot, 0.74)):
        bb = g.textbbox((0, 0), t, font=f); g.text(((w * s - (bb[2] - bb[0])) / 2 - bb[0], y * h * s - (bb[3] - bb[1]) / 2 - bb[1]), t, font=f, fill=255)
    cv = cv.resize((w, h), Image.LANCZOS)
    a = np.asarray(cv, np.float32) / 255; rnd = np.random.default_rng(seed)
    wear = rnd.random(a.shape); a *= np.where(wear < 0.10, 0.25 + 0.5 * rnd.random(a.shape), 1.0)
    blot = Image.fromarray((rnd.random((h // 6, w // 6)) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    a *= 0.72 + 0.28 * (np.asarray(blot, np.float32) / 255)
    m = Image.fromarray((a * 255).astype(np.uint8)).rotate(rot, resample=Image.BICUBIC, expand=True)
    return Image.new('RGB', m.size, red), m


def s01():
    im = fit(W_ + 's01_a.png')
    hand(im, (118, 120), '2011 · a song about product management', 56, rot=1.0, seed=11)
    im.save(OUT + '01_sketchbook_2011.png')


def s11():
    im = fit(W_ + 's11_page.png')
    hand(im, (118, 104), 'Charlie wrote this about product management in 2011.', 40, rot=1.0, seed=21)
    hand(im, (118, 166), 'We shipped The Vibe Coding Song in 2026.', 40, rot=0.6, seed=22)
    hand(im, (118, 262), 'For every idea that waited in a drawer.', 50, color=(52, 70, 120), rot=0.8, seed=23)
    col, m = stamp('SAVE COMPLETE', '· 2026 ·')
    im.paste(col, (1250, 80), m)
    im.save(OUT + '11_outro_page.png')


# ----------------------------------------------------------------------------- #02 SAVE FILE screen (pixel UI)
PX = 6
MORTAR, BRICK, BRICK_HI, BRICK_LO = (13, 18, 50), (28, 33, 79), (36, 44, 104), (22, 26, 64)
GOLD, GOLD_HI, GOLD_LO, PANEL = (214, 162, 42), (248, 214, 96), (140, 98, 22), (10, 22, 52)


def bricks(img):
    g = ImageDraw.Draw(img); bw, bh = 24 * PX, 8 * PX; rnd = random.Random(4)
    g.rectangle((0, 0, W, H), fill=MORTAR)
    for r in range(H // bh + 1):
        off = (bw // 2) * (r % 2)
        for c in range(-1, W // bw + 2):
            x0, y0 = c * bw - off + PX, r * bh + PX; x1, y1 = x0 + bw - 2 * PX, y0 + bh - 2 * PX
            base = BRICK_HI if rnd.random() < 0.18 else BRICK
            g.rectangle((x0, y0, x1, y1), fill=base); g.rectangle((x0, y0, x1, y0 + PX - 1), fill=tuple(min(255, v + 10) for v in base))
            g.rectangle((x0, y1 - PX + 1, x1, y1), fill=BRICK_LO)


def frame(g, box, inner=PANEL, t=PX * 2):
    x0, y0, x1, y1 = box
    g.rectangle((x0 - t - PX, y0 - t - PX, x1 + t + PX, y1 + t + PX), fill=(6, 8, 20))
    g.rectangle((x0 - t, y0 - t, x1 + t, y1 + t), fill=GOLD)
    g.rectangle((x0 - t, y0 - t, x1 + t, y0 - t + PX - 1), fill=GOLD_HI); g.rectangle((x0 - t, y0 - t, x0 - t + PX - 1, y1 + t), fill=GOLD_HI)
    g.rectangle((x0 - t, y1 + t - PX + 1, x1 + t, y1 + t), fill=GOLD_LO); g.rectangle((x1 + t - PX + 1, y0 - t, x1 + t, y1 + t), fill=GOLD_LO)
    g.rectangle(box, fill=inner)


def ptext(img, xy, text, px, fill, shadow=(6, 8, 20), anchor='la', scale=None):
    """crisp pixel text: render PressStart2P at 8px-grid size, upscale NEAREST."""
    k = scale or max(1, px // 8)
    f = ImageFont.truetype(PS2P, 8)
    bb = f.getbbox(text); w, h = bb[2] + 2, bb[3] + 2
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).text((0, 0), text, font=f, fill=255)
    m = m.point(lambda v: 255 if v > 100 else 0).resize((w * k, h * k), Image.NEAREST)
    x, y = xy
    if anchor == 'ma': x -= m.width // 2
    if shadow:
        o = min(k, 8); img.paste(Image.new('RGB', m.size, shadow), (x + o, y + o), m)
    img.paste(Image.new('RGB', m.size, fill), (x, y), m)
    return m.size


def torch(img, x, y):
    g = ImageDraw.Draw(img); p = PX
    g.rectangle((x - 5 * p, y + 10 * p, x + 5 * p, y + 12 * p), fill=(120, 84, 30))
    g.rectangle((x - 3 * p, y + 6 * p, x + 3 * p, y + 10 * p), fill=(200, 40, 60))
    g.rectangle((x - 2 * p, y + 1 * p, x + 2 * p, y + 6 * p), fill=(248, 160, 40)); g.rectangle((x - 1 * p, y - 2 * p, x + 1 * p, y + 4 * p), fill=(255, 230, 120))


def s02():
    img = Image.new('RGB', (W, H)); bricks(img); g = ImageDraw.Draw(img)
    for x in (150, W - 150): torch(img, x, 120)
    # title
    frame(g, (360, 66, W - 360, 186))
    ptext(img, (W // 2, 90), 'SAVE FILE FOUND', 72, GOLD_HI, anchor='ma', scale=9)
    # save slot card
    frame(g, (300, 250, W - 300, 650), inner=(14, 30, 70))
    port = Image.open(R + 'assets/sprites/portrait_charlie.png').convert('RGBA').crop((0, 0, 32, 32)).resize((32 * 8, 32 * 8), Image.NEAREST)
    g.rectangle((350, 288, 350 + 256 + 24, 288 + 256 + 24), fill=GOLD); g.rectangle((362, 300, 362 + 256, 300 + 256), fill=(40, 52, 110))
    img.paste(port, (362, 300), port)
    ptext(img, (362 + 128, 584), 'CHARLIE', 24, (230, 230, 240), anchor='ma', scale=4)
    ptext(img, (700, 290), '2011', 200, (250, 244, 220), scale=26)
    ptext(img, (708, 560), '"fixtures & functions"', 32, (110, 220, 160), scale=4)
    # buttons: CONTINUE? (pressed) / NEW GAME (dim)
    bx0, by0, bx1, by1 = 980, 722, 1640, 842
    flash = Image.new('L', (W, H), 0); ImageDraw.Draw(flash).rounded_rectangle((bx0 - 50, by0 - 50, bx1 + 50, by1 + 50), radius=60, fill=150)
    flash = flash.filter(ImageFilter.GaussianBlur(28)); img.paste(Image.new('RGB', (W, H), (255, 244, 200)), (0, 0), flash)
    g = ImageDraw.Draw(img)
    frame(g, (bx0, by0 + PX, bx1, by1 + PX), inner=(250, 214, 96))          # pressed: shifted down one pixel step
    ptext(img, ((bx0 + bx1) // 2, by0 + 34), 'CONTINUE?', 56, (40, 24, 6), shadow=(255, 246, 200), anchor='ma', scale=7)
    frame(g, (980, 890, 1640, 966), inner=(20, 26, 60))
    ptext(img, (1310, 910), 'NEW GAME', 32, (90, 100, 140), shadow=None, anchor='ma', scale=5)
    # Jade (approved hair-down sprite, pencil in hand), graphite line removed; the pencil's pink eraser end presses CONTINUE?
    spr = Image.open(R + 'assets/sprites/jade_draw_graphite_hi.png').convert('RGBA')
    a = np.asarray(spr).copy(); a[:, 93:, 3] = 0; spr = Image.fromarray(a)
    k = 5; spr = spr.resize((spr.width * k, spr.height * k), Image.NEAREST)
    # eraser end at sprite px ~(91,33) -> button left edge
    sx, sy = bx0 + 6 - 91 * k, by0 + 40 - 33 * k
    sh = Image.new('L', spr.size, 0); sh.paste(spr.split()[3].point(lambda v: 110 if v else 0), (0, 0))
    img.paste(Image.new('RGB', spr.size, (6, 8, 20)), (sx + k * 2, sy + k * 2), sh)
    img.paste(spr, (sx, sy), spr)
    img.save(OUT + '02_save_file_continue.png')


def copies():
    for src, dst in [('s03_b.png', '03_paper_0020.png'), ('s04_e.png', '04_paper_0048.png'), ('s05_a.png', '05_paper_0147.png'),
                     ('s06_d.png', '06_paper_0223.png'), ('s07_b.png', '07_flood_full_frame.png'), ('s08_d.png', '08_band_on_stage_0147.png'),
                     ('s09_e.jpg', '09_slab_fixtures.png'), ('s10_c.png', '10_slab_functions.png')]:
        fit(W_ + src).save(OUT + dst)


if __name__ == '__main__':
    s01(); s02(); s11(); copies(); print('ok')
