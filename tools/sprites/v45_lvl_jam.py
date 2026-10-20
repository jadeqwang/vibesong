"""v45_lvl: hand-pixeled jam frames for the 出发 launch shot (act2 chorus 72.1-77.76, "Ricky's guitar levels up reality").

  ricky_strum.png  (36x44 x 5, anchor [18,43], from ricky_idle f0, same palette/grid)
      0 = UP     picking hand raised above the strings (pre-stroke)
      1 = HIT    downstroke: hand swept past the strings, body dips 1 px (knees)
      2 = RING   follow-through: hand low and out, body back up
      3 = WIND   windmill: picking arm straight up overhead (the last big strum's wind-up)
      4 = SLAM   the big hit: hand far down, body dips 2 px
  charlie_jam.png  (36x44 x 3, anchor [18,43], from charlie_idle f0; hat untouched = canon tan, never grey)
      0 = up, 1 = NOD (head + shoulders down 1 px), 2 = STOMP prep (front foot lifted 2 px)

Run:  .venv/bin/python -I tools/sprites/v45_lvl_jam.py [--preview out.png]
Writes the two PNGs into assets/sprites/ and adds/refreshes their entries in assets/sprites/sprites.json (round-trip safe).
"""
import json, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SP = ROOT / 'assets' / 'sprites'
hx = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
CLEAR = (0, 0, 0, 0)

# Ricky palette (ricky_idle)
O, SK, SKS, WH, DB, BR, GW = map(hx, ['#0c0703', '#df9d6b', '#b88260', '#ececec', '#492c1c', '#844b1d', '#c6bab2'])
SB1, SB2, SB3, NAV = map(hx, ['#80a0de', '#5a82c7', '#95b3e9', '#06183b'])


def frame(img, f, fw=36):
    return img.crop((f * fw, 0, (f + 1) * fw, img.height)).copy()


def overlay(base, pts, outline=O, skip=lambda q: False):
    """pts: {(x,y): rgba}; draws an outlined limb on top (outline = 1 px 4-neighbour ring not in pts)."""
    px = base.load(); W, H = base.size
    ring = set()
    for (x, y) in pts:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if q not in pts and 0 <= q[0] < W and 0 <= q[1] < H and not skip(q): ring.add(q)
    for q in ring: px[q] = outline
    for q, c in pts.items(): px[q] = c
    return base


def fill(base, rows, x0, y0, pal):
    """rows of chars; '.' = clear, ' ' = keep, others via pal"""
    px = base.load()
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            if ch == ' ': continue
            px[x0 + i, y0 + j] = CLEAR if ch == '.' else pal[ch]
    return base


def shift_rows(base, y0, y1, d, cut_rows):
    """move rows y0..y1 down by d px (body dip): rows in cut_rows (shins) are removed to make room."""
    W, H = base.size
    src = [[base.getpixel((x, y)) for x in range(W)] for y in range(H)]
    keep = [y for y in range(H) if y not in cut_rows]
    # rows above the cut move down by len(cut) ; we rebuild bottom-up
    out = Image.new('RGBA', (W, H), CLEAR); px = out.load()
    rows = [None] * (H - len(keep)) + keep    # top rows become clear
    for y, sy in enumerate(rows):
        if sy is None: continue
        for x in range(W): px[x, y] = src[sy][x]
    return out


def body_patch(fr):
    """repaint the guitar's upper bout where the resting forearm was (x 9-15, y 23-27)"""
    pal = {'#': O, 'C': SKS, 'u': BR, 'W': WH, 'w': SK, 'g': GW, 'R': DB, 'b': SB1, 'B': SB2}
    return fill(fr, [
        '#bB###     ',   # y22 x8..: sleeve cuff closes at the elbow
        '##CCCCW#   ',   # y23 upper bout top edge
        '.#uCwCWW   ',   # y24
        '.#uCCWWW   ',   # y25
        '..#CwWWWg  ',   # y26
        '.#uCCWLL   '.replace('L', 'W'),   # y27
    ], 8, 22, pal)


def ricky():
    idle = Image.open(SP / 'ricky_idle.png').convert('RGBA')
    f0 = frame(idle, 0)
    out = []
    # 0 UP: forearm angled up, hand above the strings in front of the shirt hem
    a = body_patch(f0.copy())
    arm = {}
    for (x, y) in [(10, 23), (11, 23), (11, 22), (12, 22), (12, 21), (13, 21), (13, 20), (14, 20), (14, 21), (15, 20), (15, 21), (13, 22)]:
        arm[(x, y)] = SK
    arm[(14, 22)] = SKS; arm[(15, 22)] = SKS; arm[(10, 24)] = SKS; arm[(11, 24)] = SKS
    out.append(overlay(a, arm))
    # 1 HIT: hand swept down past the strings (low, in front of the lower bout), body dips 1 px
    b = body_patch(f0.copy())
    arm = {}
    for (x, y) in [(10, 23), (10, 24), (11, 24), (11, 25), (12, 25), (12, 26), (13, 26), (13, 27), (14, 27), (14, 28), (15, 28), (13, 28), (14, 29), (15, 29), (16, 29), (15, 30)]:
        arm[(x, y)] = SK
    for q in [(11, 23), (12, 24), (16, 30), (14, 30)]: arm[q] = SKS
    b = overlay(b, arm)
    out.append(shift_rows(b, 0, 33, 1, {35}))
    # 2 RING: hand low and out to the side (follow-through), body up
    c = body_patch(f0.copy())
    arm = {}
    for (x, y) in [(10, 23), (10, 24), (11, 24), (11, 25), (11, 26), (12, 26), (12, 27), (12, 28), (13, 28), (13, 29), (12, 29), (13, 30), (12, 30)]:
        arm[(x, y)] = SK
    for q in [(11, 27), (14, 30), (14, 29)]: arm[q] = SKS
    out.append(overlay(c, arm))
    # 3 WIND: picking arm straight up overhead (sleeve then fist), the windmill wind-up
    d = body_patch(f0.copy())
    # clear the original upper sleeve column (x 8-12, y 17-22) back to the torso edge, then draw the raised arm
    fill(d, ['....#', '...#b', '..#bL', '.#BLL', '#BbLb', '#bLLb'], 8, 17, {'#': O, 'b': SB1, 'L': WH, 'B': SB2})
    arm = {}
    for y in range(8, 18):       # sleeve: 3 px wide checks, rising from the shoulder
        for i, x in enumerate((9, 10, 11)):
            arm[(x, y)] = [SB1, WH, SB2, WH, SB3][(y + i) % 5]
    arm[(12, 16)] = SB2; arm[(12, 17)] = SB1; arm[(8, 16)] = SB2; arm[(8, 17)] = SB1
    for (x, y) in [(9, 5), (10, 5), (11, 5), (9, 6), (10, 6), (11, 6), (12, 6), (9, 7), (10, 7), (11, 7), (12, 7)]:
        arm[(x, y)] = SK
    arm[(12, 5)] = SKS; arm[(9, 7)] = SKS
    d = overlay(d, arm, skip=lambda q: q[1] >= 18 and 8 < q[0] < 13)
    fill(d, ['#bLB#'], 8, 18, {'#': O, 'b': SB1, 'L': WH, 'B': SB2})   # armpit: sleeve joins the shirt
    out.append(d)
    # 4 SLAM: like HIT but further and deeper (2 px dip)
    e = body_patch(f0.copy())
    arm = {}
    for (x, y) in [(10, 23), (10, 24), (11, 24), (11, 25), (12, 25), (12, 26), (13, 26), (13, 27), (14, 27), (14, 28), (15, 28), (15, 29), (16, 29), (16, 30), (17, 30), (17, 31), (16, 31), (18, 31)]:
        arm[(x, y)] = SK
    for q in [(11, 23), (12, 24), (18, 32), (17, 32)]: arm[q] = SKS
    e = overlay(e, arm)
    out.append(shift_rows(e, 0, 33, 2, {34, 36}))
    return out


def charlie():
    idle = Image.open(SP / 'charlie_idle.png').convert('RGBA')
    f0 = frame(idle, 0)
    nod = shift_rows(f0.copy(), 0, 33, 1, {36})          # head + body bounce 1 px (knees)
    # nod: the head dips one more px relative to the shoulders (rows 4..18 = hat + face)
    W, H = nod.size; src = nod.copy(); px = nod.load(); sp = src.load()
    for y in range(19, 4, -1):
        for x in range(W):
            if sp[x, y - 1][3] > 0: px[x, y] = sp[x, y - 1]
            elif y < 19: px[x, y] = CLEAR
    for x in range(W): px[x, 4] = CLEAR
    stomp = f0.copy(); px = stomp.load(); sp = f0.load()
    for y in range(32, 44):                                # front (image-right) leg: x 18..26 up 2 px
        for x in range(17, 27):
            px[x, y] = CLEAR
    for y in range(32, 44):
        for x in range(17, 27):
            if sp[x, y][3] > 0 and y - 2 >= 0: px[x, y - 2] = sp[x, y]
    return [f0, nod, stomp]


def strip(frames):
    W, H = frames[0].size
    s = Image.new('RGBA', (W * len(frames), H), CLEAR)
    for i, f in enumerate(frames): s.alpha_composite(f, (i * W, 0))
    return s


def ncolors(img):
    return len({p for p in img.getdata() if p[3] > 0})


def main():
    r, c = strip(ricky()), strip(charlie())
    r.save(SP / 'ricky_strum.png'); c.save(SP / 'charlie_jam.png')
    js = SP / 'sprites.json'; s = js.read_text(); d = json.loads(s)
    d['sprites']['ricky_strum'] = {'file': 'ricky_strum.png', 'frame_w': 36, 'frame_h': 44, 'frames': 5, 'anchor': [18, 43], 'fps': 8, 'loop': False,
        'colors': ncolors(r), 'source': 'assets/sprites/ricky_idle.png f0 hand-pixeled (tools/sprites/v45_lvl_jam.py)',
        'note': 'v45_lvl strum: 0 up, 1 hit (1 px dip), 2 ring (follow-through), 3 windmill (arm up), 4 slam (2 px dip)'}
    d['sprites']['charlie_jam'] = {'file': 'charlie_jam.png', 'frame_w': 36, 'frame_h': 44, 'frames': 3, 'anchor': [18, 43], 'fps': 4, 'loop': False,
        'colors': ncolors(c), 'source': 'assets/sprites/charlie_idle.png f0 (tools/sprites/v45_lvl_jam.py)',
        'note': 'v45_lvl jam along: 0 up, 1 nod (head+body 1-2 px down), 2 stomp prep (front foot up 2 px)'}
    js.write_text(json.dumps(d, indent=1, ensure_ascii=False))
    if '--preview' in sys.argv:
        out = sys.argv[sys.argv.index('--preview') + 1]; S = 8
        canvas = Image.new('RGBA', (max(r.width, c.width) * S, (r.height + c.height) * S + 8), (60, 60, 80, 255))
        canvas.alpha_composite(r.resize((r.width * S, r.height * S), Image.NEAREST), (0, 0))
        canvas.alpha_composite(c.resize((c.width * S, c.height * S), Image.NEAREST), (0, r.height * S + 8))
        canvas.save(out)
    print('ricky_strum', r.size, ncolors(r), 'charlie_jam', c.size, ncolors(c))


if __name__ == '__main__':
    main()
