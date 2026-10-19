"""Pass B paper M1 review sheet -> engine/out/review/passB/paper/m1_sheet.jpg (run from the repo root with .venv python)."""
from PIL import Image, ImageDraw, ImageFont
O = 'engine/out/review/passB/paper/'; S = 'assets/v4_stills/'; W = 'media/cutscenes/_work/passB/'
FB = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
FZ = ImageFont.truetype('/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf', 26)   # CJK
def mixed(d, xy, text, fill):
    x, y = xy
    for ch in text:
        f = FZ if ord(ch) > 0x2e80 else FB; d.text((x, y), ch, font=f, fill=fill); x += d.textlength(ch, font=f)
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 21)
blocks = []
def label(text, sub='', h=70, bg=(28, 26, 34)):
    im = Image.new('RGB', (1920, h), bg); d = ImageDraw.Draw(im); mixed(d, (14, 8), text, (255, 210, 90))
    if sub: d.text((14, 40), sub, font=F, fill=(225, 225, 235))
    return im
def pair(a, b, la, lb):
    im = Image.new('RGB', (1920, 540 + 34), (16, 16, 20)); d = ImageDraw.Draw(im)
    im.paste(Image.open(a).convert('RGB').resize((956, 538), Image.LANCZOS), (0, 34)); im.paste(Image.open(b).convert('RGB').resize((956, 538), Image.LANCZOS), (964, 34))
    d.text((8, 6), la, font=F, fill=(255, 255, 255)); d.text((972, 6), lb, font=F, fill=(255, 255, 255)); return im
def fit(path, w=1920):
    im = Image.open(path).convert('RGB'); return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
blocks.append(label('v4 Pass B · paper · M1', 'left: the card in the engine (1080p, mid-word) | right: its approved target still. Clips: media/cutscenes/paper_*/ · lip sync measured per clip against the demucs vocal stem', 80, (50, 30, 60)))
C = [('03 · 0:20.15-23.75 · "my imagination is linked" · mid "imagination" 21.50', O + 'sig_p03_21.50.png', S + '03_paper_0020.png',
      'Seedance 2.5 480p take pB_03_sd25_t4 (vocal-stem ref from 20.00) · offset +0.08 s from the "m" closure of "my" (envelope correlation unusable on this legato line) · chest label repaired to the dot'),
     ('04 · 0:48.57-50.66 · "I just ask myself" · mid "just" 49.05', O + 'sig_p04_49.05.png', S + '04_paper_0048.png',
      'Seedance 2.5 480p take pB_04_sd25_t2 (vocal-stem ref from 48.30) · measured offset +0.10 s (corr 0.665; residual on the slot clip 0.00 s, corr 0.68) · screen glow steady'),
     ('05 · 1:47.15-1:50.41 · 世界 是我的舞台 · mid 舞 109.35 (clip frame; stage_3d integrates)', O + 'sig_p05_109.35_clipframe.png', S + '05_paper_0147.png',
      'Seedance 2.5 480p take pB_05_sd25_t1 (song-mix ref from 106.85) · measured offset 0.00 s (corr 0.63) · second 1420 MHz patch on the chest repaired to the dot'),
     ('06 · 2:23.40-2:26.20 · "I just ask myself what it is" · mid "what" 145.45', O + 'sig_p06_145.45.png', S + '06_paper_0223_v2.png',
      'Seedance 2.5 480p take pB_06_sd25_t3 (vocal-stem ref from 143.30), first frame = the fixed #06 · measured offset +0.25 s (corr 0.63; residual on the slot clip -0.02 s) · hands back at 146.197')]
for t, a, b, sub in C:
    blocks.append(label('CARD ' + t, sub)); blocks.append(pair(a, b, 'card in the engine', 'approved target'))
blocks.append(label('#06 FIX · forehead a bit taller, more head/hair volume (inside a head/hair mask; brows, eyes, face below the brows untouched)',
                    'hairline-to-brow 70 px -> 84 px (= brow-to-nose 85 px; approved sheet ~1.1x, was 0.82x) · crown ~30 px higher · nano-banana-pro volume edit + smooth geometric lift'))
blocks.append(pair(S + '06_paper_0223.png', S + '06_paper_0223_v2.png', 'OLD #06 (approved)', 'FIXED #06 = assets/v4_stills/06_paper_0223_v2.png'))
a = Image.open(S + '06_paper_0223.png').crop((180, 60, 820, 600)); b = Image.open(S + '06_paper_0223_v2.png').crop((180, 60, 820, 600))
row = Image.new('RGB', (1920, 812), (16, 16, 20)); row.paste(a.resize((956, 806)), (0, 3)); row.paste(b.resize((956, 806)), (964, 3)); blocks.append(row)
for k, ttl in (('p03', '03'), ('p04', '04'), ('p05', '05'), ('p06', '06')):
    blocks.append(label(f'LIP-SYNC WORD STRIP · card {ttl}', 'mouth crops from the final slot clip at syllable times in song time; rows = picture shifted -0.1 / 0 (as shipped) / +0.1 s'))
    blocks.append(fit(O + f'ws_{k}.jpg'))
blocks.append(label('PROPOSED, NOT APPLIED · 03 / 04 / 05 forehead (same note as #06)',
                    'hairline-to-brow vs brow-to-nose: 03 0.64x, 04 0.79x, 05 0.72x (fixed #06 1.0x, approved sheet ~1.1x). Rough geometric previews (left = approved, right = +20% forehead + crown); the cards are built on the APPROVED stills'))
blocks.append(fit(W + 'forehead_prop/prop_all.jpg', 1100))
a = Image.open(W + 'brows/card_old_f20.png').crop((835, 270, 1085, 420)); b = Image.open(W + 'brows/card_v11_f20.png').crop((835, 270, 1085, 420))
blocks.append(label('BRIDGE CARD 125.769 · v11 brows tracked onto every frame (same 0.309 s start = +0.10 s)', 'left: shipped adv0.10 card | right: fallback_card_480p_portrait_adv0.10_v11.mp4 (frame 20, 3.8x)'))
row = Image.new('RGB', (1920, 580), (16, 16, 20)); row.paste(a.resize((956, 574)), (0, 3)); row.paste(b.resize((956, 574)), (964, 3)); blocks.append(row)
H = sum(b.height for b in blocks); out = Image.new('RGB', (1920, H), (16, 16, 20)); y = 0
for b in blocks:
    if b.width != 1920: c = Image.new('RGB', (1920, b.height), (16, 16, 20)); c.paste(b, ((1920 - b.width) // 2, 0)); b = c
    out.paste(b, (0, y)); y += b.height
out.save(O + 'm1_sheet.jpg', quality=88); print(out.size)
