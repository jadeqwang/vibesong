"""A-2 post-pass: canon fixes, anchors, eraser x2 strips, code-made eraser blink/smear + props; installs everything.
Usage: a2_post.py STAGE_DIR [--dry]   (STAGE_DIR = where build.py wrote the a2.json strips)
Writes final strips to assets/sprites/ and registers them via a2_install.install (sprites.json backed up first)."""
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scale2x as S2
import hand_tips as HT
import a2_install as I
R = "/home/jade/Documents/vibesong"; SP = R + "/assets/sprites/"
STAGE = sys.argv[1]; DRY = "--dry" in sys.argv
OUTD = STAGE + "/final/" if DRY else SP
os.makedirs(OUTD, exist_ok=True)
def hexc(h): h = h.lstrip("#"); return [int(h[i:i + 2], 16) for i in (0, 2, 4)]
def load(n): return np.array(Image.open(STAGE + "/" + n + ".png").convert("RGBA"))
def frames(a, w): return [a[:, k * w:(k + 1) * w].copy() for k in range(a.shape[1] // w)]
def strip(fs): return np.concatenate(fs, 1)
def put(f, x, y, c): f[y, x, :3] = c; f[y, x, 3] = 255
def save(n, a): Image.fromarray(a).save(OUTD + n + ".png")
def shift(f, dx, dy):
    o = np.zeros_like(f); H, W = f.shape[:2]
    ys, xs = np.nonzero(f[..., 3]); ys2, xs2 = ys + dy, xs + dx
    ok = (ys2 >= 0) & (ys2 < H) & (xs2 >= 0) & (xs2 < W)
    assert ok.all(), "shift clips the sprite"
    o[ys2, xs2] = f[ys, xs]; return o
def top_blob(f, rows=4):
    """bbox centre-x and top-y of the topmost opaque pixels (the raised fist / strap loop)"""
    ys, xs = np.nonzero(f[..., 3]); y0 = ys.min(); sel = ys < y0 + rows
    return int(round(xs[sel].mean())), int(y0)
# Jade palette (from her strips)
OUT = [0x27, 0x21, 0x23]; YEL = [0xf8, 0xa8, 0x08]; PINK = [0xf8, 0x50, 0x70]; BLUE = [0x10, 0x5a, 0xec]
RED = [0xf0, 0x40, 0x48]; GRN = [0x46, 0xc8, 0x60]; SKIN = [0xf9, 0xb8, 0x78]
entries = []
def entry(name, frames_, w, h, anchor, fps, loop, note, source, **kw):
    entries.append(dict(name=name, file=name + ".png", frame_w=w, frame_h=h, frames=frames_, anchor=anchor, fps=fps, loop=loop,
                        source=source, note=note, **kw))
SRC = "assets/sheets/raw/"

# ---------------------------------------------------------------- jade_twin_draw (44x44 x4, no loop)
fs = frames(load("jade_twin_draw"), 44)
# f0: the X crossing must stay hidden inside the bun: the one light-yellow pixel inside the bun -> hair
f = fs[0]
for y in range(9, 12):
    for x in range(14, 30):
        if f[y, x, 3] and abs(int(f[y, x, 0]) - 0xf8) < 8 and f[y, x, 1] > 0xd0: put(f, x, y, OUT)
save("jade_twin_draw", strip(fs))
entry("jade_twin_draw", 4, 44, 44, [22, 43], 8, False,
      "A-2 17.38: 0 hands at the bun (pencils X'd through it) -> 1 both pencils out like twin swords, bun undone -> 2 hair falling, "
      "arms crossed -> 3 stance, hair DOWN, blue-cap pencil forward (rainbow tip), pink-cap pencil back. Hold frame 3.",
      SRC + "a2_jade_a_t1.png")

# ---------------------------------------------------------------- jade_erase (36x44 x3 loop) + pink rubber crumbs
fs = frames(load("jade_erase"), 36)
CRUMB_LO = [0xd9, 0x60, 0x3a] if False else PINK
for k, f in enumerate(fs):
    m = HT.near(f, np.array(PINK), 40); ys, xs = np.nonzero(m)
    i = np.argmax(xs); cx, cy = int(xs[i]), int(ys[i])           # the cap end furthest right = rubbing face
    pts = [(2, -2), (3, 1), (1, 3), (4, -1)] if k != 1 else [(2, -3), (3, 0), (2, 2), (4, 2)]
    if k == 2: pts = [(2, -3), (3, -1), (1, 2), (3, 3)]
    for dx, dy in pts:
        x, y = cx + dx, cy + dy
        if 0 <= x < 36 and 0 <= y < 44 and not f[y, x, 3]: put(f, x, y, PINK if (dx + dy) % 2 else [0xf9, 0xb8, 0x78])
save("jade_erase", strip(fs))
entry("jade_erase", 3, 36, 44, [18, 43], 8, True,
      "A-2: HAIR DOWN; graphite pencil flipped, rubbing with its PINK/ORANGE cap on a wall to her RIGHT (cap reaches x~33-35); "
      "pink rubber crumbs baked in; blue-cap pencil in the other hand. Frames = top / middle / bottom of the stroke.",
      SRC + "a2_jade_a_t1.png")

# ---------------------------------------------------------------- dangles: align the raised fist, anchor = that hand
def dangle(name, w, h, fix=None):
    fs = frames(load(name), w)
    if fix: fix(fs)
    tb = [top_blob(f) for f in fs]
    y0 = min(t[1] for t in tb); m = np.mean([t[0] for t in tb])
    def fits(xt):
        for f, t in zip(fs, tb):
            xs = np.nonzero(f[..., 3].any(0))[0]; d = xt - t[0]
            if xs.min() + d < 0 or xs.max() + d >= w: return False
        return True
    x0 = next(xt for xt in sorted(range(w), key=lambda v: abs(v - m)) if fits(xt))
    out = [shift(f, x0 - t[0], y0 - t[1]) for f, t in zip(fs, tb)]
    save(name, strip(out))
    return [x0, y0 + 1]
def jade_dangle_fix(fs):
    f = fs[1]   # the blue-cap pencil in her free hand: give its tip the rainbow core (frame 0 already has one)
    ys, xs = np.nonzero(HT.near(f, np.array(YEL), 60) & (np.arange(44)[:, None] > 26))
    i = np.argmax(ys - xs); x, y = int(xs[i]), int(ys[i])   # the lowest-left yellow pixel = the sharpened end
    put(f, x, y, RED); put(f, x - 1, y + 1, BLUE) if not f[y + 1, x - 1, 3] or f[y + 1, x - 1, :3].sum() < 120 else None
    if f[y + 1, x - 1, 3] and f[y + 1, x - 1, :3].tolist() == BLUE: pass
    put(f, x - 1, y, GRN) if f[y, x - 1, 3] and f[y, x - 1, :3].sum() > 120 else None
a = dangle("jade_dangle", 36, 44, jade_dangle_fix)
entry("jade_dangle", 2, 36, 44, a, 4, True,
      "A-2 chain/parachute: HAIR DOWN, hanging by her raised hand (anchor = that fist), free hand down-left holding the blue-cap "
      "pencil (rainbow tip) and free to take the next hero's hand. 0 legs forward, 1 legs back. No bar baked in.",
      SRC + "a2_jade_b_t1.png", hand_free=None)
a = dangle("ricky_dangle", 36, 44)
entry("ricky_dangle", 2, 36, 44, a, 4, True,
      "A-2 chain/parachute: hanging by his raised hand (anchor = that fist), free hand reaching down-right, Strat on its strap at the hip. "
      "0 legs forward, 1 legs back. No bar baked in.", SRC + "a2_ricky_dangle_t2.png")

# ---------------------------------------------------------------- ricky_dangle_play (36x48 x2): anchor = top of the strap loop
fs = frames(load("ricky_dangle_play"), 36)
for f in fs:   # stray pickup-yellow pixels on the neck -> neck wood
    m = HT.near(f, np.array([0xfc, 0xc9, 0x08]), 40)
    for y, x in zip(*np.nonzero(m)): f[y, x, :3] = [0xdf, 0x9d, 0x6b]
tb = [top_blob(f, 2) for f in fs]; x0 = tb[0][0]; y0 = min(t[1] for t in tb)
fs = [shift(f, x0 - t[0], y0 - t[1]) for f, t in zip(fs, tb)]
save("ricky_dangle_play", strip(fs))
entry("ricky_dangle_play", 2, 36, 48, [x0, y0 + 1], 4, True,
      "A-2 updraft 40.6-41.6: Ricky hangs from his guitar STRAP (anchor = top of the strap loop, hook it on Charlie's boot), "
      "Strat neck pointing UP, sustained note; 1 = sway + mouth open.", SRC + "a2_ricky_t1.png")

# ---------------------------------------------------------------- charlie_parachute_carry (48x56 x3): hat brim on the canopy, anchor = boots
fs = frames(load("charlie_parachute_carry"), 48)
TAN_D = None
boots = []
for f in fs:
    op = f[..., 3] > 0
    # canopy = rows above the strings; its rim row = lowest row where the canopy is >= 30 px wide in the top 20 rows
    widths = [op[y].sum() for y in range(20)]
    rim = max(y for y in range(20) if widths[y] >= 30)
    xs = np.nonzero(op[rim])[0]; L = xs.min()
    # a cap PEAK (stiff brim) sticking out of the rim on the left: 6x2 px, darker tan, outlined
    pal_tan = f[rim - 2, L + 3, :3].copy()
    dark = (pal_tan.astype(int) * 0.72).astype(np.uint8)
    cols = np.unique(f[f[..., 3] > 0][:, :3], axis=0)          # palette lock: snap to the nearest colour already in the strip
    dark = cols[np.argmin(np.abs(cols.astype(int) - dark.astype(int)).sum(1))]
    OUTC = cols[np.argmin(cols.astype(int).sum(1))]                # Charlie's own outline colour
    for x in range(max(0, L - 5), L + 4):
        for y, c in ((rim - 1, OUTC), (rim, dark), (rim + 1, dark), (rim + 2, OUTC)):
            if x == max(0, L - 5) and rim <= y <= rim + 1: c = OUTC
            if not f[y, x, 3] or x < L or y >= rim: put(f, x, y, c)
    # boots = the left-most and right-most opaque pixel clusters in the bottom 8 rows
    b = op[-9:]; ys, xs = np.nonzero(b)
    boots.append([[int(xs.min()) + 2, 55 - 3], [int(xs.max()) - 2, 55 - 3]])
save("charlie_parachute_carry", strip(fs))
entry("charlie_parachute_carry", 3, 48, 56, [24, 55], 6, True,
      "A-2 parachute 25.0/35.6/40.9: Charlie (no cap: the cap IS the canopy, inverted crown dome + peak on the left rim) holding the "
      "strings, both boots out sideways for Jade/Ricky to hang from. anchor = bottom centre between the boots; per-frame boot grab "
      "points in 'boots' [[lx,ly],[rx,ry]].", SRC + "a2_charlie_t2.png", boots=boots)

# ---------------------------------------------------------------- reads (36x44 x2)
for n, src, extra in (("jade_read", "a2_jade_b_t1.png", "HAIR DOWN; blue-cap pencil (rainbow tip) follows the lines. "),
                      ("ricky_read", "a2_ricky_t1.png", "Strat on its strap. "), ("charlie_read", "a2_charlie_t1.png", "")):
    a = load(n)
    if n == "jade_read":   # the pencil's far (page-side) end is drawn pure blue: make it the multicolour core, so it never reads as a 2nd blue cap
        from scipy import ndimage
        for f in frames(a, 36):
            pass
        for k in range(2):
            f = a[:, k * 36:(k + 1) * 36]
            lab, nb = ndimage.label(HT.near(f, np.array(BLUE), 40), structure=np.ones((3, 3)))
            if nb < 2: continue
            cs = [np.argwhere(lab == i + 1) for i in range(nb)]
            tip = max(cs, key=lambda c: (c[:, 0] + c[:, 1]).mean())
            for j, (y, x) in enumerate(sorted(map(tuple, tip), key=lambda t: t[1])): f[y, x, :3] = (RED, GRN)[j % 2]
    save(n, a)
    entry(n, 2, 36, 44, [18, 43], 2, True,
          "A-2 reading freeze 43.89: holding a small open page at chest height (a plain sheet is drawn in the hands; overlay "
          "prop_page_* beside/over it), head down reading; 1 = slight nod. " + extra, SRC + src)

# ---------------------------------------------------------------- eraser x2 strips
def x2(a):
    a = a.copy(); a[a[..., 3] == 0] = 0
    return S2.thin_outline(S2.scale2x(a))
sk = load("eraser_skid")
save("eraser_skid_x2", x2(sk))
entry("eraser_skid_x2", 3, 132, 124, [66, 123], 8, False,
      "A-2 27.8-31 colored tiles stop it: braking, leaning back, cheeks squished, squeak 'o' mouth, sweat drop + skid streak/crumbs "
      "baked in; 0 brake, 1 hardest lean, 2 nearly stopped (wobble). Scale2x of a 66x62 base, eraser palette.", SRC + "a2_eraser_t1.png")
pe = load("eraser_peer")
# a pixel '?' above its head (to the upper right), outlined, 5x7 at base res
Q = ["01110", "10001", "00001", "00110", "00100", "00000", "00100"]
for k, f in enumerate(frames(pe, 66)):
    pass
pf = frames(pe, 66)
for k, f in enumerate(pf):
    ys, xs = np.nonzero(f[..., 3]); top = ys.min()
    qx, qy = int(xs.max()) - 6, max(1, top - 10 + k)
    qx = min(qx, 66 - 7)
    for j, row in enumerate(Q):
        for i, ch in enumerate(row):
            if ch == "1":
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        xx, yy = qx + i + dx, qy + j + dy
                        if 0 <= xx < 66 and 0 <= yy < 62 and not f[yy, xx, 3]: put(f, xx, yy, [2, 1, 2])
    for j, row in enumerate(Q):
        for i, ch in enumerate(row):
            if ch == "1": put(f, qx + i, qy + j, [0xfa, 0xf3, 0xe8])
save("eraser_peer_x2", x2(strip(pf)))
entry("eraser_peer_x2", 2, 132, 124, [66, 123], 3, True,
      "A-2 34.3 edge of the world: leaning over a ledge to its RIGHT, peering down, puzzled; a small '?' is baked in above its head. "
      "Scale2x of a 66x62 base.", SRC + "a2_eraser_t1.png")

# ---------------------------------------------------------------- eraser_blink_x2: chase frame 0 with the eye shut / annoyed half-lid
ch = np.array(Image.open(SP + "eraser_chase.png").convert("RGBA"))[:, :66].copy()
BODY = [0x8c, 0x82, 0x82]; INK = [2, 1, 2]; LID = [0x64, 0x5e, 0x61]; WHITE = [0xfa, 0xf3, 0xe8]
shut = ch.copy()
for y in range(28, 36):            # clear the whole eye (keep the right silhouette outline at x >= 57)
    for x in range(45, 57):
        if shut[y, x, 3]: put(shut, x, y, BODY)
for x, y in ((45, 30), (46, 31), (47, 31), (48, 32), (49, 32), (50, 32), (51, 32), (52, 32), (53, 32), (54, 31), (55, 31), (56, 30),
             (49, 33), (52, 33)):  # closed eye: a U-shaped lid line + two lashes, running into the face edge
    put(shut, x, y, INK)
half = ch.copy()
for y in (31, 32):                 # lid dropped one more row: only a 2-px slit of eye white is left
    for x in range(47, 56):
        if half[y, x, 3]: put(half, x, y, INK)
for x in range(46, 57): put(half, x, 27, INK)        # flat, heavy, annoyed brow
put(half, 45, 28, INK)
save("eraser_blink_x2", x2(strip([shut, half])))
entry("eraser_blink_x2", 2, 132, 124, [66, 123], 4, False,
      "A-2 17.38 'NOT VERY EFFECTIVE': eraser_chase_x2 frame 0 pose; 0 eyes shut (blink), 1 annoyed half-lid + flat brow.",
      "assets/sprites/eraser_chase.png (code edit: tools/sprites/a2_post.py)")

# ---------------------------------------------------------------- eraser_smear_x2: 4 overlay levels of rainbow smudge (transparent elsewhere)
RB = [hexc(h) for h in ['#ff4d6d', '#ff7a3d', '#ffb02e', '#ffe14d', '#b6e84a', '#4fd06a', '#2ec4a6', '#2bb4e8', '#3b7bff', '#6a5cff', '#a35cff', '#e858d0']]
base = ch  # chase frame 0 geometry (all 3 chase frames share the body position within 1-2 px)
op = base[..., 3] > 0; lum = base[..., :3].astype(int).sum(-1)
body = op & (lum > 200)                      # skip the black outline / pupils so the face still reads through
ov = []
rng = np.random.default_rng(7)
grain = rng.random((62, 66))
TONES = {tuple(c) for c in ([0x8c, 0x82, 0x82], [0x9f, 0x94, 0x93], [0x76, 0x6e, 0x70], [0xee, 0xe0, 0xd2], [0xcd, 0xc0, 0xb9],
                            [0xba, 0xaf, 0xad], [0x64, 0x5e, 0x61], [0x45, 0x7b, 0xbe])}
def ok_px(y, x):
    if not base[y, x, 3] or tuple(base[y, x, :3]) not in TONES: return False
    if 38 <= y <= 49 and 40 <= x <= 52: return False   # the mouth + teeth stay readable
    return x <= 51                                      # the right fist stays grey
# streaks: (start x at the bottom row, length up-right, width); each level adds streaks / lengthens them
STREAKS = [[(30, 8, 3)], [(30, 10, 4), (35, 7, 3)], [(29, 13, 4), (34, 10, 4), (25, 8, 3)], [(28, 15, 5), (33, 13, 4), (24, 11, 4), (38, 8, 3)]]
for lev in range(4):
    o = np.zeros((62, 66, 4), np.uint8)
    for k, (x0s, L, wd) in enumerate(STREAKS[lev]):
        for t in range(L):                      # walk up-right: 1 px up per px right (rub direction)
            for w_ in range(wd):
                x, y = x0s + t + w_, 54 - t - (k % 2)
                if not (0 <= y < 62 and 0 <= x < 66) or not ok_px(y, x): continue
                if grain[y, x] < 0.12: continue
                put(o, x, y, RB[(t // 2 + k * 3) % 12])
    ov.append(o)
save("eraser_smear_x2", x2(strip(ov)))
entry("eraser_smear_x2", 4, 132, 124, [66, 123], 1, False,
      "A-2 OVERLAY (transparent elsewhere): rainbow smudge on the Eraser's front/cheek, levels 0-3 (pick a frame, don't animate). "
      "Registered to eraser_chase_x2 / eraser_blink_x2 (same anchor). On eraser_skid_x2 offset it per frame by 'skid_offset'.",
      "code: tools/sprites/a2_post.py", skid_offset=None)

# ---------------------------------------------------------------- props
INKP = hexc('#1b1b22'); PAPER = hexc('#fbf3df'); PAPER_LO = hexc('#e2d6bd'); REDG = hexc('#e0484a'); REDL = hexc('#f2a6a6')
def page(bg=PAPER, lo=PAPER_LO):
    p = np.zeros((24, 20, 4), np.uint8)
    p[:, :, :3] = INKP; p[:, :, 3] = 255
    p[1:23, 1:19, :3] = bg; p[22, 1:19, :3] = lo; p[1:23, 18, :3] = lo
    return p
FP = ImageFont.truetype(R + "/engine/assets/fonts/fusion-pixel-12px-proportional-zh_hans.ttf", 12)
def glyph(ch, font=FP):
    im = Image.new("L", (16, 16), 0); d = ImageDraw.Draw(im); d.fontmode = "1"; d.text((1, 0), ch, font=font, fill=255)
    a = np.array(im) > 127; ys, xs = np.nonzero(a)
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
# 字帖: one big 田字格 cell with 画 + a red header tick + stroke-order strip
z = page()
for x in range(2, 17): z[5, x, :3] = REDG; z[20, x, :3] = REDG
for y in range(5, 21): z[y, 2, :3] = REDG; z[y, 16, :3] = REDG
for k in range(3, 16, 2): z[12, k, :3] = REDL; z[k + 3 if k + 3 < 20 else 19, 9, :3] = REDL
g = glyph("画"); gh, gw = g.shape; ox, oy = 2 + (15 - gw) // 2, 5 + (16 - gh) // 2
for y, x in zip(*np.nonzero(g)): z[oy + y, ox + x, :3] = INKP
for x in range(2, 9): z[2, x, :3] = REDG                  # header rule (red, like a copybook title)
z[2, 15, :3] = REDG; z[2, 16, :3] = REDG
save("prop_page_zitie", z)
F35 = {"T": ["111", "010", "010", "010", "010"], "A": ["010", "101", "111", "101", "101"], "B": ["110", "101", "110", "101", "110"],
       "S": ["011", "100", "010", "001", "110"], "P": ["110", "101", "110", "100", "100"], "E": ["111", "100", "110", "100", "111"],
       "C": ["011", "100", "100", "100", "011"]}
def text35(p, s_, x, y, c):
    for ch_ in s_:
        for j, row in enumerate(F35[ch_]):
            for i, v in enumerate(row):
                if v == "1": p[y + j, x + i, :3] = c
        x += 4
# TAB: 'TAB' header, six strings, fret marks (2-px blobs on the strings), bar lines
t = page(hexc('#ffffff'), hexc('#e4e8f0'))
text35(t, "TAB", 2, 2, INKP)
for s_ in range(6): t[9 + s_ * 2, 2:17, :3] = hexc('#9a9aa2')
t[9:20, 2, :3] = INKP; t[9:20, 16, :3] = INKP; t[9:20, 9, :3] = hexc('#c4c4ca')
for x, s_ in ((4, 5), (4, 4), (4, 3), (7, 5), (7, 4), (7, 3), (11, 4), (11, 3), (14, 1), (14, 0)):
    t[9 + s_ * 2, x:x + 2, :3] = hexc('#e8344a') if x == 14 else INKP
t[21, 2:9, :3] = hexc('#e8344a')
save("prop_page_tab", t)
# SPEC: blue header bar with 'SPEC', checkbox bullets
sp = page(hexc('#ffffff'), hexc('#e4e8f0'))
sp[1:8, 1:18, :3] = hexc('#2f5fd0'); text35(sp, "SPEC", 2, 2, hexc('#ffffff'))
for k, (wd, done) in enumerate(((11, 1), (8, 1), (12, 0), (7, 1), (10, 0))):
    y = 10 + k * 2 + k // 1
    if y > 20: break
    sp[y:y + 2, 2:4, :3] = hexc('#3ad06a') if done else hexc('#9a9aa2')
    sp[y, 5:5 + wd, :3] = INKP if k == 0 else hexc('#9a9aa2')
save("prop_page_spec", sp)
for n, d in (("prop_page_zitie", "字帖 copybook page: red 田字格 cell with 画"), ("prop_page_tab", "guitar TAB: 6 strings, fret marks"),
             ("prop_page_spec", "SPEC doc: blue header bar, checkbox bullets")):
    entry(n, 1, 20, 24, [10, 23], 1, False, "A-2 prop (reading freeze 43.89): " + d + ".", "code: tools/sprites/a2_post.py")
# hat canopy 40x20: Charlie's beige cap, crown inverted as a dome, button on top, peak on the left, strings stubs down
cc = np.array(Image.open(OUTD + "charlie_parachute_carry.png").convert("RGBA"))[:, :48]
op = cc[..., 3] > 0; widths = [op[y].sum() for y in range(24)]
rim = max(y for y in range(24) if widths[y] >= 30); top = int(np.nonzero(op.any(1))[0][0])
can = cc[top:rim + 2].copy(); ys, xs = np.nonzero(can[..., 3]); can = can[:, xs.min():xs.max() + 1]
im = Image.fromarray(can)
hc = np.zeros((20, 40, 4), np.uint8)
cw = min(40, can.shape[1]); chh = min(20, can.shape[0])
if can.shape[1] > 40 or can.shape[0] > 20:
    im = im.resize((min(40, can.shape[1]), min(20, can.shape[0])), Image.NEAREST); can = np.array(im)
oy = 20 - can.shape[0]; ox = (40 - can.shape[1]) // 2
hc[oy:oy + can.shape[0], ox:ox + can.shape[1]] = can
save("prop_hat_canopy", hc)
entry("prop_hat_canopy", 1, 40, 20, [20, 19], 1, False,
      "A-2 prop: open hat canopy (inverted beige flat-cap crown, peak on the left), cut from charlie_parachute_carry frame 0; "
      "anchor = rim centre (hang strings from it).", "assets/sprites/charlie_parachute_carry.png")

# skid offset for the smear overlay: shift of the eye/face centre between chase f0 and each skid frame (x2 px)
def face_c(f):
    m = (f[..., 3] > 0) & (np.abs(f[..., :3].astype(int) - np.array(WHITE)).sum(-1) < 30)
    ys, xs = np.nonzero(m[:, 33:]); return xs.mean() + 33, ys.mean()
c0 = face_c(ch)
offs = []
for f in frames(sk, 66):
    try: c = face_c(f); offs.append([int(round((c[0] - c0[0]) * 2)), int(round((c[1] - c0[1]) * 2))])
    except ValueError: offs.append([0, 0])
for e in entries:
    if e["name"] == "eraser_smear_x2": e["skid_offset"] = offs
    if e.get("hand_free", 0) is None: e.pop("hand_free")
json.dump(entries, open(STAGE + "/entries.json", "w"), indent=1, ensure_ascii=False)
if not DRY:
    print("backup:", I.install(entries))
print("ok", len(entries), "entries ->", OUTD)
