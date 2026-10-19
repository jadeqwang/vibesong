#!/usr/bin/env python3
"""Build the CREATURES review sheets from rendered stills.  CREATURES team tool.
usage: <venv python> tools/creatures_sheets.py HI_DIR LO_DIR OUT_DIR [--r2]
  --r2: suffix _r2, k09 shots are upright, morph strips start from the upright dance pose (morphpose_*), + upright_sheet_r2.jpg
        (also needs HI: up_* updance_* upbug_* wheelroll_* draftup* lineup_upright)
  HI_DIR: 1920x1080 stills of k09_* m3_* eraser_* lineup_*   (tools/creatures_render.py HI 1920x1080 'k09_*' 'm3_*' 'eraser_*' 'lineup_*')
  LO_DIR: 1280x720 stills of morph_* draft* dance_* bug_* turn_* feat_*
Writes: bugs_vs_k09_sheet.jpg, features_sheet.jpg, morph_strip_<bug>.jpg, eraser_sheet.jpg (+ bugs_anim_sheet.jpg,
drafts_sheet.jpg, turntables_sheet.jpg, lineup_sheet.jpg)."""
import sys, os
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
K09 = ROOT + '/keyframes/concepts/k09_bug_dance_paint_flood.png'
K11 = ROOT + '/keyframes/concepts/k11_perspective_lock.png'
M3 = ROOT + '/engine/out/mocks/half2/m3_recruit.png'
M2 = ROOT + '/engine/out/mocks/half2/m2_triple_tech.png'
ESHEET = ROOT + '/assets/sheets/eraser_boss_sheet.png'
K09_BOX = {'ladybug': (888, 900, 240), 'beetle': (1058, 945, 270), 'moth': (1328, 912, 240), 'caterpillar': (1565, 935, 290), 'firefly': (1617, 838, 210)}
M3_BOX = {'lamp': (10, 215, 235, 505), 'glider': (205, 280, 645, 460), 'wheel': (595, 312, 835, 552), 'bridge': (180, 560, 760, 800), 'button': (745, 525, 1105, 800)}
M2_LAMP = (180, 470, 330, 600)
K11_ER = (1470, 250, 1890, 730)
ES = 1.79  # eraser sheet display -> original scale
ES_BOX = {'chasing (concept)': (25, 1115, 445, 1975), 'looming (concept)': (455, 1115, 885, 1975), 'redeemed (concept)': (895, 1115, 1315, 1975)}
BUGS = ['ladybug', 'beetle', 'moth', 'caterpillar', 'firefly']
FEAT = {'ladybug': 'button', 'beetle': 'wheel', 'moth': 'glider', 'caterpillar': 'bridge', 'firefly': 'lamp'}
BG, FG, DIM, ACC = (22, 24, 32), (236, 236, 240), (150, 154, 168), (255, 214, 92)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)

def fit(im, w, h, bg=BG):
    im = im.convert('RGB'); r = min(w / im.width, h / im.height); im2 = im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS)
    c = Image.new('RGB', (w, h), bg); c.paste(im2, ((w - im2.width) // 2, (h - im2.height) // 2)); return c
def sq(im, cx, cy, s): return im.crop((cx - s // 2, cy - s // 2, cx + s // 2, cy + s // 2))
def centre(im, fw, fh, dy=0): cx, cy = im.width // 2, im.height // 2 + dy; return im.crop((cx - fw // 2, cy - fh // 2, cx + fw // 2, cy + fh // 2))
def sheet(cells, cols, cw, ch, title, sub='', lab=24):
    rows = (len(cells) + cols - 1) // cols; top = 86 if sub else 60
    S = Image.new('RGB', (cols * cw + (cols + 1) * 10, top + rows * (ch + lab + 10) + 10), BG); d = ImageDraw.Draw(S)
    d.text((12, 12), title, font=F(30, True), fill=FG)
    if sub: d.text((12, 52), sub, font=F(17), fill=DIM)
    for i, (im, label, col) in enumerate(cells):
        x, y = 10 + (i % cols) * (cw + 10), top + (i // cols) * (ch + lab + 10)
        if im is not None: S.paste(fit(im, cw, ch), (x, y + lab))
        d.text((x + 2, y + 2), label, font=F(17, True), fill=col or FG)
    return S

def main(hi, lo, out, r2=False):
    X = '_r2' if r2 else ''; MP = 'morphpose_' if r2 else 'morph_'
    os.makedirs(out, exist_ok=True); H = lambda n: Image.open(f'{hi}/{n}.png'); L = lambda n: Image.open(f'{lo}/{n}.png')
    # (1) bugs vs k09
    k = Image.open(K09); cells = []
    for b in BUGS:
        cx, cy, s = K09_BOX[b]; cells.append((sq(k, cx, cy, s), f'k09 · {b}', DIM)); cells.append((centre(H('k09_' + b), 900, 900, 20), f'ours · {b}', ACC))
    sheet(cells, 4, 460, 460, 'BUGS vs k09 (same orientation, ~35° high camera)' + (' · round 2: upright stance (caterpillar crawls)' if r2 else ''), 'left: keyframes/concepts/k09 crop · right: 3D-native voxel bug (src/core/creatures), shared Act III world, review sun').save(f'{out}/bugs_vs_k09_sheet{X}.jpg', quality=90)
    # (2) features vs m3
    m3 = Image.open(M3); m2 = Image.open(M2); cells = []
    for b in BUGS:
        f = FEAT[b]; ref = m3.crop(M3_BOX[f])
        cells.append((ref, f'm3 mock · {f.upper()}', DIM)); cells.append((centre(H('m3_' + f), 1200, 900), f'ours · {f.upper()} (m3 framing)', ACC)); cells.append((centre(L(f'feat_{f}_0'), 860, 640), f'ours · {f} 3/4', ACC))
        if f == 'lamp': cells[-3] = (m2.crop(M2_LAMP), 'm2 mock · LAMP (cap as shade)', DIM)
    sheet(cells, 3, 520, 390, 'FEATURES vs the m2/m3 mocks', 'firefly→LAMP (Charlie\'s flat cap as shade) · moth→GLIDER · beetle→WHEEL · caterpillar→BRIDGE · ladybug→SHIP BUTTON · each = its bug\'s exact voxel count, same eyes').save(f'{out}/features_sheet{X}.jpg', quality=90)
    # (3) morph strips
    for b in BUGS:
        cells = [(centre((H if r2 else L)(f'{MP}{b}_{i}'), 1500 if r2 else 1000, 960 if r2 else 640), f'u = {i / 7:.2f}', ACC if i in (0, 7) else FG) for i in range(8)]
        sub = ('round 2: starts from the LIVE upright dance pose (no snap at u = 0) · ' if r2 else '') + 'every voxel flies bug slot → feature slot (stroke-order pairing, arc, spin, ease, stagger, colour lerp); u is a pure function of time'
        sheet(cells, 8, 400, 256, f'MORPH · {b} → {FEAT[b]}', sub).save(f'{out}/morph_strip_{b}{X}.jpg', quality=88)
    # (4) eraser
    k11 = Image.open(K11); es = Image.open(ESHEET); cells = []
    cells += [(centre(H('eraser_gray'), 760, 900), 'GRAY · grumpy (heavy lids, bags)', ACC), (centre(H('eraser_pink'), 760, 900), 'PINK #f2788f / top #f7a1b0 · happy', ACC), (centre(H('eraser_pink_cap'), 760, 900), 'PINK + small beige flat cap', ACC)]
    cells += [(centre(H('eraser_gray_34'), 900, 900), 'gray · 3/4 (wear, chips, crumbly rubbed edge, crumbs)', FG), (centre(H('eraser_look'), 760, 900), 'gray · look', FG), (centre(H('eraser_sing'), 900, 900), 'pink + cap · sing', FG)]
    cells += [(H('eraser_mountain'), 'MOUNTAIN SCALE (900 units tall, hi LOD) with the 5 features', ACC), (H('eraser_mountain_face'), 'mountain · face = 206 voxels wide (hi LOD)', ACC), (H('eraser_mountain_pink'), 'mountain · pink + cap', ACC)]
    cells += [(k11.crop(K11_ER), 'ref · k11 Eraser', DIM)] + [(es.crop(tuple(int(v * ES) for v in bx)), 'ref · ' + n, DIM) for n, bx in list(ES_BOX.items())[1:]]
    sheet(cells, 3, 600, 400, 'THE ERASER (sculpted voxels)', 'beveled block, edge wear + chips, rubbed wedge edge, Act I rainbow smudge, sleeve with blue stripes, stubby arms; gray / pink (animatable 0..1, hatched wavefront) / cap; LOD lo 60 · mid 120 · hi 240 voxels wide').save(f'{out}/eraser_sheet{X}.jpg', quality=90)
    if r2:
        cells = []
        for b in BUGS:
            cells += [(centre(H(f'up_{b}_front'), 1100, 1000), f'{b} · upright front', ACC), (centre(H(f'up_{b}_34'), 1100, 1000), f'{b} · upright 3/4', ACC),
                      (centre(H(f'updance_{b}_1'), 1500, 1000), f'{b} · dance', FG), (centre(H(f'updance_{b}_3'), 1500, 1000), f'{b} · dance', FG),
                      (centre(H(f'upbug_{b}_{1 if b != "moth" else 2}'), 1500, 1000), f'{b} · BUG loop', FG)]
        cells += [(centre(H(f'draftup_{b}'), 1100, 1000), f'draft · {b} upright', DIM) for b in BUGS]
        cells += [(centre(H(f'wheelroll_{i}'), 1100, 1000), f'wheel rolls {i * 0.9:.1f} rad · face stays upright', FG) for i in range(4)] + [(H('lineup_upright'), 'line-up (battle camera)', FG)]
        sheet(cells, 5, 380, 330, 'UPRIGHT STANCE (round 2) at the battle camera (3/4 high, 26° elevation)', "makeBug(name, { stance: 'upright' }) or set({ stance }) · hind legs stand, front legs are arms · dance and bug loops compose with it · drafts pose too").save(f'{out}/upright_sheet_r2.jpg', quality=88)
        return
    # extras: anims, drafts, turntables, lineups
    cells = []
    for b in BUGS:
        cells += [(centre(L(f'dance_{b}_{i}'), 900, 600), f'{b} · dance beat {i * 0.25:.2f}', FG) for i in range(4)]
    for b in BUGS:
        cells += [(centre(L(f'bug_{b}_{i}'), 900, 600), f'{b} · BUG {i}', ACC) for i in range(0, 6, 2)] + [(None, '', FG)]
    sheet(cells, 4, 400, 266, 'BUG anims: dance (beat-locked) and the bug behaviour loops', 'firefly blinks off-beat · moth dives and bonks · beetle rolls a tight circle · caterpillar grows extra segments (overflow) · ladybug flashes its spots').save(f'{out}/bugs_anim_sheet.jpg', quality=86)
    cells = [(centre(L(f'draft_{b}'), 900, 620), f'draft · {b}', FG) for b in BUGS] + [(None, '', FG)] + [(centre(L(f'draftp_caterpillar_{i}'), 900, 620), f'sketching p = {(i + 1) / 4:.2f}', ACC) for i in range(4)]
    sheet(cells, 5, 380, 262, 'GRAPHITE DRAFT state (triple tech 就当草稿)', 'outline-only pencil render: voxel creases + colour boundaries, stroke-ordered reveal p, occluded by the hidden body').save(f'{out}/drafts_sheet.jpg', quality=86)
    cells = [(centre(L(f'turn_{b}_{i}'), 900, 620), f'{b} · {i * 90}°', FG) for b in BUGS for i in range(4)] + [(centre(L(f'feat_{FEAT[b]}_{i}'), 900, 620), f'{FEAT[b]} · view {i}', ACC) for b in BUGS for i in range(3)]
    sheet(cells, 4, 380, 262, 'TURNTABLES: bugs (4 views) and features (3 views)').save(f'{out}/turntables_sheet.jpg', quality=84)
    sheet([(H('lineup_bugs'), 'the five bugs', FG), (H('lineup_features'), 'the five features', FG)], 2, 900, 506, 'LINE-UPS on the mesa B stage').save(f'{out}/lineup_sheet.jpg', quality=88)

if __name__ == '__main__': main(*sys.argv[1:4], r2='--r2' in sys.argv)
