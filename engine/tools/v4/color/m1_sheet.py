#!/usr/bin/env python3
"""M1 sheet for the colour unit: before | after pairs (1080p stills scaled), the colour-script strip, and the
3D pre-flood alternative (warm plaster) beside the approved targets.
usage: .venv/bin/python engine/tools/v4/color/m1_sheet.py <stills dir> <out.jpg>"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

ENG = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
SRC, OUT = sys.argv[1], sys.argv[2]
F = lambda s: ImageFont.truetype(os.path.join(ENG, 'assets/fonts/Inter.ttf'), s)
FZ = lambda s: ImageFont.truetype(os.path.join(ENG, 'assets/fonts/LXGWWenKai-Medium.ttf'), s)

FRAMES = [  # (t, label)
    (5, '0:05 PAINT IT'), (21, '0:21 linked'), (36, '0:36 说出来 (VOID)'), (48, '0:48 prompt gag'), (60, '1:00 FUNCTIONS ground'),
    (74, '1:14 出发 (the preview)'), (80, '1:20 the build / turn'), (87, '1:27 the drop'), (100, '1:40 Talos'), (110, '1:50 the stage'),
    (120, '2:00 the flood'), (130, '2:10 bridge dusk'), (140, '2:20 the 画 slam'), (160, '2:40 rebuilt'), (180, '3:00 aerial'),
]
TW, TH, LAB, GAP = 472, 266, 26, 8
BG, FG, DIM = (22, 22, 26), (235, 235, 235), (150, 150, 158)

def tile(name, t):
    p = os.path.join(SRC, f'{name}_{t}.png')
    return Image.open(p).convert('RGB').resize((TW, TH), Image.LANCZOS) if os.path.exists(p) else Image.new('RGB', (TW, TH), (60, 0, 0))

def strip(w, h):
    data = json.loads(subprocess.check_output(['node', os.path.join(ENG, 'tools/v4/color/sample_cs.mjs'), 'default', '0.05'], cwd=ENG))
    warm = json.loads(subprocess.check_output(['node', os.path.join(ENG, 'tools/v4/color/sample_cs.mjs'), 'warm', '0.05'], cwd=ENG))
    S, W, cues = data['samples'], warm['samples'], data['cues']
    im = Image.new('RGB', (w, h), BG); d = ImageDraw.Draw(im)
    L, R, top, band, plot = 60, w - 20, 34, 46, h - 34 - 46 - 50
    T1 = 203.0; X = lambda t: L + (R - L) * t / T1
    d.text((L, 6), 'COLOUR SCRIPT  ·  world saturation vs song time (band = what colour the world may show; line = saturation; heroes / pencils / fresh rainbow strokes / beams are exempt throughout)', font=F(15), fill=FG)
    d.text((L, h - 14), 'lines: white = 3D world saturation (default) · blue = 2D world · orange = alt "warm plaster" 3D · yellow = the three colour cues · triangles = the frames above', font=F(12), fill=DIM)
    import colorsys
    tints = {'paper': (239, 226, 200), 'dusk': (185, 174, 203)}
    for x in range(L, R):
        t = (x - L) / (R - L) * T1; k = min(len(S) - 1, int(round(t / 0.05))); _, s2, s3, ta, tn, _ = S[k]
        for y in range(band):
            r, g, b = colorsys.hsv_to_rgb(((x - L) / 90.0) % 1.0, 0.8, 0.95)
            c = [r * 255, g * 255, b * 255]; Lm = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
            tc = tints.get(tn, (255, 255, 255)); tl = 0.2126 * tc[0] + 0.7152 * tc[1] + 0.0722 * tc[2]
            base = [Lm * (1 - ta) + Lm * tc[i] / tl * ta for i in range(3)]
            sat = s3
            out = [base[i] + (c[i] - base[i]) * sat if sat <= 1 else Lm + (c[i] - Lm) * sat for i in range(3)]
            im.putpixel((x, top + y), tuple(max(0, min(255, int(v))) for v in out))
    y0 = top + band + 8; y1 = y0 + plot
    for v in (0, 0.5, 1.0):
        yy = y1 - (y1 - y0) * v / 1.2; d.line([(L, yy), (R, yy)], fill=(50, 50, 58)); d.text((8, yy - 8), f'{v:.1f}', font=F(13), fill=DIM)
    def line(samples, col, idx, wdt=2):
        pts = [(X(s[0]), y1 - (y1 - y0) * min(1.2, s[idx]) / 1.2) for s in samples]; d.line(pts, fill=col, width=wdt)
    line(W, (215, 160, 90), 2, 1); line(S, (120, 200, 255), 1, 1); line(S, (255, 255, 255), 2, 2)
    for name, t in cues.items():
        d.line([(X(t), top), (X(t), y1)], fill=(255, 210, 63) if name in ('plant', 'bridge', 'slam') else (110, 110, 120), width=1)
    for name, t, lab in [('chufa', cues['chufa'], '出发 1:12 (preview: exempt)'), ('plant', cues['plant'], 'flood 1:59.02'), ('bridge', cues['bridge'], 'bridge drain'), ('slam', cues['slam'], '画 slam: back for good')]:
        d.text((X(t) + 3, y0 + 2 if name != 'bridge' else y0 + 22), lab, font=FZ(15), fill=(255, 210, 63))
    for t, _ in FRAMES: d.polygon([(X(t), y1 + 2), (X(t) - 5, y1 + 10), (X(t) + 5, y1 + 10)], fill=FG)
    for s in range(0, 204, 10): d.text((X(s) - 8, y1 + 12), f'{s // 60}:{s % 60:02d}', font=F(12), fill=DIM)
    return im

def main():
    cols = 2; W = cols * (2 * TW + GAP) + (cols + 1) * 20
    rows = (len(FRAMES) + cols - 1) // cols
    head = 70; st = strip(W, 230)
    alt_h = LAB + 30 + 3 * (TH + LAB + GAP)
    H = head + rows * (TH + LAB + GAP) + st.height + 20 + alt_h + 20
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
    d.text((20, 12), 'v4 Pass B · colour unit · M1: ration the colour (before = --look k08b, after = --look k08b+cs; 1080p stills, one frozen tree)', font=F(24), fill=FG)
    d.text((20, 44), 'Graphite + paper before 1:59 (heroes, pencils and the strokes she just drew keep colour) · flood = the one full-spectrum break · bridge drains to dusk · 画 slam brings it back', font=F(15), fill=DIM)
    for i, (t, lab) in enumerate(FRAMES):
        r, c = divmod(i, cols); x = 20 + c * (2 * TW + GAP + 20); y = head + r * (TH + LAB + GAP)
        d.text((x, y + 3), f'{lab}   (t={t})', font=FZ(17), fill=FG); d.text((x + TW + GAP, y + 5), 'after', font=F(13), fill=(255, 210, 63)); d.text((x + TW - 50, y + 5), 'before', font=F(13), fill=DIM)
        im.paste(tile('before', t), (x, y + LAB)); im.paste(tile('after', t), (x + TW + GAP, y + LAB))
    y = head + rows * (TH + LAB + GAP) + 10; im.paste(st, (0, y)); y += st.height + 20
    d.text((20, y), 'Alternative for the 3D pre-flood (86.4-119): "warm plaster" keeps the golden light as sepia (sat 0.30) | default graphite (sat 0.12) | the approved target', font=F(17), fill=FG); y += LAB + 8
    tgt = {87: '09_slab_fixtures.png', 100: None, 110: '08_band_on_stage_0147.png'}
    for t in (87, 100, 110):
        x = 20
        for name, lab in (('warm', 'alt: warm plaster'), ('after', 'default'), ('before', 'before')):
            im.paste(tile(name, t), (x, y + LAB)); d.text((x, y + 4), f'{lab} · t={t}', font=F(14), fill=FG); x += TW + GAP
        if tgt[t]:
            p = os.path.join(ENG, '..', 'assets', 'v4_stills', tgt[t]); im.paste(Image.open(p).convert('RGB').resize((TW, TH), Image.LANCZOS), (x, y + LAB))
            d.text((x, y + 4), f'approved target {tgt[t][:2]}', font=F(14), fill=(255, 210, 63))
        y += TH + LAB + GAP
    im.save(OUT, quality=90); print(OUT, im.size)

main()
