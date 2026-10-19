"""A-4 orthographic hero turnarounds + item props (for carving sculpted voxel figures).
Every hero view: 72x96 frame, figure 80 px from sole to top of head (hair / cap / bun; Jade's pencil caps may poke above),
baseline y = 95 (lowest sole row), centre x = 36 (front/back: centre of the legs/hips; side: centre of the hip column).
Usage: a4_turn.py build STAGE      -> STAGE/turn_*.png + STAGE/turn_raw.json (per-view measurements)
"""
import sys, os, json, glob
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import boxes as B
import pixelize as P
R = "/home/jade/Documents/vibesong"; SP = R + "/assets/sprites/"; RAW = R + "/assets/sheets/raw/"
FW, FH, BASE, CX, HT = 72, 96, 95, 36, 80
VIEWS = ("front", "side", "back")

def palette(who):
    cols = set()
    for f in glob.glob(SP + who + "_*.png"):
        if "_x2" in f: continue
        a = np.array(Image.open(f).convert("RGBA")); cols |= set(map(tuple, a[a[..., 3] > 0][:, :3]))
    return np.array(sorted(cols))

def pencilish(rgb):
    """saturated yellow / blue / pink pixels (Jade's pencils) in the raw sheet"""
    r, g, b = [rgb[..., i].astype(int) for i in range(3)]
    yel = (r > 200) & (g > 140) & (b < 90) & (r - b > 120)
    blu = (b > 170) & (r < 110) & (b - r > 90) & (g < 125)
    pnk = (r > 220) & (g < 140) & (b > 90) & (b < 170)
    return yel | blu | pnk

def views_of(sheet, rows=1):
    im, bx = B.components(RAW + sheet)
    big = sorted([b for b in bx if (b[3] - b[1]) > 200], key=lambda b: ((b[1] + b[3]) // 2 // 300, b[0]))
    out = []
    for r in range(rows):
        row = sorted([b for b in big if (b[1] + b[3]) / 2 > im.shape[0] * r / rows and (b[1] + b[3]) / 2 <= im.shape[0] * (r + 1) / rows],
                     key=lambda b: b[0])[:3]
        grp = []
        for m in row:   # attach small satellite blobs (separate pencil tips etc.) that overlap the main box's columns
            sat = [b for b in bx if b not in big and b[0] < m[2] + 20 and b[2] > m[0] - 20 and b[1] < m[3] and b[3] > m[1] - 120]
            grp.append([m] + sat)
        out.append(grp)
    return im, out

def build_view(im, boxes, pal, exclude_pencils=False, scale=None):
    x0 = min(b[0] for b in boxes) - 4; y0 = min(b[1] for b in boxes) - 4; x1 = max(b[2] for b in boxes) + 4; y1 = max(b[3] for b in boxes) + 4
    crop = im[y0:y1, x0:x1].copy(); crop[..., 3] = np.where(crop[..., 3] >= 128, 255, 0)
    op = crop[..., 3] > 0
    body = op & ~pencilish(crop[..., :3]) if exclude_pencils else op
    ys = np.nonzero(body.sum(1) >= 3)[0]; top, bot = ys[0], ys[-1]
    scale = scale or (bot - top + 1) / HT
    sp = P.pixelize(crop, scale, pal, dark_boost=1.3, fit_phase=True, inner=0.6, min_blob=2)
    a = sp[..., 3] > 0; yy = np.nonzero(a.any(1))[0]; xx = np.nonzero(a.any(0))[0]
    sp = sp[yy[0]:yy[-1] + 1, xx[0]:xx[-1] + 1]
    return sp, scale

def centre_x(sp, view):
    a = sp[..., 3] > 0; h = a.shape[0]
    rows = range(int(h * 0.55), int(h * 0.68))      # hips: below the hands' reach in an A-pose? (hands hang lower) -> use leg tops
    if view == "side": rows = range(int(h * 0.60), int(h * 0.75))
    xs = [np.nonzero(a[y])[0] for y in rows]
    # widest contiguous run that contains the row's median column (the body, not a hand)
    mids = []
    for y, x in zip(rows, xs):
        if not len(x): continue
        lab, n = ndimage.label(a[y]); runs = [np.nonzero(lab == i + 1)[0] for i in range(n)]
        run = max(runs, key=len); mids.append((run[0] + run[-1]) / 2)
    return float(np.median(mids))

def place(sp, view):
    out = np.zeros((FH, FW, 4), np.uint8); h, w = sp.shape[:2]
    c = centre_x(sp, view); ox = int(round(CX - c)); oy = BASE + 1 - h
    ys, xs = np.mgrid[:h, :w]; m = sp[..., 3] > 0
    X, Y = xs[m] + ox, ys[m] + oy; ok = (X >= 0) & (X < FW) & (Y >= 0) & (Y < FH)
    if not ok.all(): print("   ! clipped", (~ok).sum(), "px")
    out[Y[ok], X[ok]] = sp[m][ok]
    return out, ox, oy

SHEETS = [  # (sheet, rows, [(name per row)], palette hero, exclude pencils per row)
    ("a4_charlie_t1.png", 1, ["charlie"], "charlie", [False]),
    ("a4_ricky_t2.png", 1, ["ricky"], "ricky", [False]),
    ("a4_jade_t1.png", 2, ["jade_up", "jade_down"], "jade", [True, False]),
]
if __name__ == "__main__" and sys.argv[1] == "build":
    stage = sys.argv[2]; os.makedirs(stage, exist_ok=True); info = {}
    for sheet, rows, names, who, excl in SHEETS:
        im, grp = views_of(sheet, rows); pal = palette(who)
        shared = {}
        for r in (reversed(range(rows)) if rows > 1 else range(rows)):   # Jade: hair-down row first, its scale is reused
            name = names[r]
            for v, boxes in zip(VIEWS, grp[r]):
                sp, sc = build_view(im, boxes, pal, excl[r], shared.get(v))
                shared.setdefault(v, sc)
                fr, ox, oy = place(sp, v)
                Image.fromarray(fr).save(f"{stage}/turn_{name}_{v}.png")
                a = fr[..., 3] > 0; ys = np.nonzero(a.any(1))[0]; xs = np.nonzero(a.any(0))[0]
                info[f"turn_{name}_{v}"] = dict(sheet=sheet, scale=round(sc, 3), bbox=[int(xs[0]), int(ys[0]), int(xs[-1]), int(ys[-1])])
                print(f"turn_{name}_{v}: scale {sc:.2f} bbox {info[f'turn_{name}_{v}']['bbox']} w={xs[-1]-xs[0]+1} h={ys[-1]-ys[0]+1}")
    json.dump(info, open(stage + "/turn_raw.json", "w"), indent=1)

# ------------------------------------------------------------------ canon post-pass (Jade)
def H(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.uint8)
INK, HAIR, WHITE, DOT = H("#141014"), H("#272123"), H("#f9f8f8"), H("#60a0f4")
F34 = {"R": ["110", "101", "110", "101"], "A": ["010", "101", "111", "101"], "E": ["111", "110", "100", "111"],
       "T": ["111", "010", "010", "010"], "H": ["101", "111", "101", "101"]}
def hide_crossing(f, cx, cy, r=5):
    """Jade hair-up BACK view: the model drew the X crossing on top of the bun. Pencil pixels lying over the hair are turned
    into hair (only the caps above the bun and the tips beside the head stay), and the bun is redrawn as a round knot of
    radius r at the crossing (cx, cy), so the crossing sits inside it."""
    op = f[..., 3] > 0; pen = pencilish(f[..., :3]) & op
    # "over the hair" = no background pixel within 3 px (the caps above the bun and the tips beside the head touch background)
    near_bg = ndimage.binary_dilation(~op, structure=np.ones((3, 3)), iterations=3)
    over = pen & ~near_bg & (np.arange(FH)[:, None] < 40)
    f[over, :3] = HAIR
    yy, xx = np.mgrid[:FH, :FW]; disk = (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r + 1
    f[disk, :3] = HAIR; f[disk, 3] = 255
    ring = disk & ~ndimage.binary_erosion(disk, [[0, 1, 0], [1, 1, 1], [0, 1, 0]])
    f[ring, :3] = INK
    sheen = disk & ((xx - cx + 1.5) ** 2 + (yy - cy + 1.5) ** 2 <= 2.5)
    f[sheen, :3] = H("#3b3130")
    return int(over.sum())
def rare_earth(f):
    """big back dot + RARE / EARTH (tools/sprites/backdot.py). Panel top = first white jacket row above the model's dot."""
    import backdot
    rgb = f[..., :3].astype(int)
    dot = ((np.abs(rgb - DOT.astype(int)).sum(-1) < 40) | (np.abs(rgb - H("#6eaaf0").astype(int)).sum(-1) < 40)) & (f[..., 3] > 0)
    ys, xs = np.nonzero(dot); cx = int(round(xs.mean())); y0 = int(ys.min())
    white = (np.abs(rgb - WHITE.astype(int)).sum(-1) < 30) & (f[..., 3] > 0)
    top = y0
    while top > 0 and white[top - 1, cx - 4:cx + 5].sum() >= 6: top -= 1
    return backdot.back_dot(f, top, cx, 12)

if __name__ == "__main__" and sys.argv[1] == "canon":
    stage = sys.argv[2]
    # hand fix of the tip cores (dumped pixels): in an X the blue-cap pencil (cap upper-left in the front view) exits lower-RIGHT
    # (rainbow core) and the pink-cap one exits lower-LEFT (graphite); mirrored in the back view.
    TIPS = {"jade_up_front": {(22, 26): "#f8a808", (23, 26): "#f8a808", (23, 27): "#f8a808", (22, 27): "#e8c496", (21, 28): "#403e46",
                              (52, 28): "#f04048", (53, 29): "#2868d8"},
            "jade_up_back": {(23, 27): "#e8c496", (22, 28): "#f04048", (22, 29): "#46c860", (23, 29): "#2868d8",
                             (51, 26): "#f8a808", (51, 27): "#f8a808", (51, 28): "#e8c496", (52, 28): "#e8c496", (53, 28): "#f8a808",
                             (53, 29): "#403e46", (52, 29): "#403e46"}}
    for n, fx in TIPS.items():
        f = np.array(Image.open(f"{stage}/turn_{n}.png").convert("RGBA"))
        for (x, y), c in fx.items():
            if f[y, x, 3]: f[y, x, :3] = H(c)
        Image.fromarray(f).save(f"{stage}/turn_{n}.png")
    f = np.array(Image.open(f"{stage}/turn_jade_up_back.png").convert("RGBA"))
    print("jade_up_back: pencil px over hair removed", hide_crossing(f, 39, 19))   # crossing located by hand (dump of the view)
    Image.fromarray(f).save(f"{stage}/turn_jade_up_back.png")
    for n in ("jade_up_back", "jade_down_back"):
        f = np.array(Image.open(f"{stage}/turn_{n}.png").convert("RGBA")); print(n, "RARE EARTH at", rare_earth(f))
        Image.fromarray(f).save(f"{stage}/turn_{n}.png")

# ------------------------------------------------------------------ install + turnaround.json
def parts(f, view):
    """approximate part boxes [x0,y0,x1,y1] (inclusive) from the silhouette: neck = narrowest row in the upper body,
    hips = first row (below the waist) where the legs separate (front/back) or 58% height (side)."""
    a = f[..., 3] > 0; ys = np.nonzero(a.any(1))[0]; top, bot = int(ys[0]), int(ys[-1]); h = bot - top + 1
    w = a.sum(1)
    lo, hi = top + int(h * 0.18), top + int(h * 0.42)
    neck = lo + int(np.argmin(w[lo:hi]))
    hip = top + int(h * 0.58)
    if view != "side":
        for y in range(top + int(h * 0.5), top + int(h * 0.8)):
            lab, n = ndimage.label(a[y, CX - 3:CX + 4])
            if not a[y, CX] and a[y, CX - 6:CX].any() and a[y, CX + 1:CX + 7].any(): hip = y; break
    def box(y0, y1, x0=0, x1=FW - 1):
        sub = a[y0:y1 + 1, x0:x1 + 1]; xs = np.nonzero(sub.any(0))[0]
        return [int(x0 + xs[0]), int(y0), int(x0 + xs[-1]), int(y1)] if len(xs) else None
    torso_rows = a[neck + 2:hip]
    # torso = the central run at chest height; arms = what lies outside it
    yc = neck + max(3, (hip - neck) // 3); lab, n = ndimage.label(a[yc]); runs = [np.nonzero(lab == i + 1)[0] for i in range(n)]
    run = min(runs, key=lambda r: abs((r[0] + r[-1]) / 2 - CX))
    tx0, tx1 = int(run[0]), int(run[-1])
    out = {"head": box(top, neck), "torso": [tx0, neck + 1, tx1, hip], "legs": box(hip + 1, bot)}
    if view != "side":
        out["arm_r"] = box(neck + 1, min(bot, hip + 8), 0, tx0 - 1); out["arm_l"] = box(neck + 1, min(bot, hip + 8), tx1 + 1, FW - 1)  # image-left/right
    else:
        out["arm"] = None
    return out

if __name__ == "__main__" and sys.argv[1] == "install":
    stage, which = sys.argv[2], sys.argv[3].split(",")    # e.g. front  or  front,side,back
    D = SP + "turn/"; os.makedirs(D, exist_ok=True)
    jp = D + "turnaround.json"
    meta = json.load(open(jp)) if os.path.exists(jp) else {
        "generated_by": "tools/sprites/a4_turn.py (A-4)", "pixel_note": "1 texel = 1 voxel column; NEAREST",
        "frame": [FW, FH], "baseline_y": BASE, "centre_x": CX, "figure_height_px": HT,
        "conventions": "orthographic; side views face screen-RIGHT; all views of all heroes share scale, baseline y=95 (lowest sole row) "
                       "and centre x=36 (front/back: centre of hips/legs; side: centre of the hip column). Jade jade_up: pencil caps poke above the 80 px.",
        "views": {}, "items": {}}
    raw = json.load(open(stage + "/turn_raw.json"))
    for name in ("charlie", "ricky", "jade_up", "jade_down"):
        for v in which:
            n = f"turn_{name}_{v}"; f = np.array(Image.open(f"{stage}/{n}.png").convert("RGBA"))
            Image.fromarray(f).save(D + n + ".png")
            a = f[..., 3] > 0; ys = np.nonzero(a.any(1))[0]; xs = np.nonzero(a.any(0))[0]
            meta["views"][n] = dict(file="turn/" + n + ".png", size=[FW, FH], baseline_y=BASE, centre_x=CX,
                                    bbox=[int(xs[0]), int(ys[0]), int(xs[-1]), int(ys[-1])], parts=parts(f, v),
                                    source="assets/sheets/raw/" + raw[n]["sheet"], colors=int(len(np.unique(f[a][:, :3], axis=0))))
            print("installed", n, meta["views"][n]["bbox"])
    json.dump(meta, open(jp, "w"), indent=1)

def mirror_iou(f, b):
    bm = np.zeros_like(b); bm[:, 1:] = b[:, :0:-1]       # mirror about x = 36 (x -> 72 - x)
    return (f & bm).sum() / (f | bm).sum()
if __name__ == "__main__" and sys.argv[1] == "align_back":
    stage = sys.argv[2]
    for name in ("charlie", "ricky", "jade_up", "jade_down"):
        f = np.array(Image.open(f"{stage}/turn_{name}_front.png"))[..., 3] > 0
        B_ = np.array(Image.open(f"{stage}/turn_{name}_back.png").convert("RGBA"))
        best = max((mirror_iou(f, np.roll(B_[..., 3] > 0, s, 1)), s) for s in (-2, -1, 0, 1, 2))
        Image.fromarray(np.roll(B_, best[1], 1)).save(f"{stage}/turn_{name}_back.png")
        print(name, "back shifted", best[1], "-> mirror IoU %.3f" % best[0])

# ------------------------------------------------------------------ items (front + side, same scale as the turnarounds)
ITEM_SCALE = 7.1   # sheet px per texel: Charlie's acoustic in turn_charlie_back is ~51 px long, his cap ~32 px wide (front)
ITEMS = [("item_strat", "ricky", 0), ("item_acoustic", "charlie", 2), ("item_flatcap", "charlie", 4)]
def pencil(kind, L=28):
    """vertical pencil, cap at the top, tip at the bottom; 5 px wide incl. outline (3 px body). front == side (round body)."""
    W = 5; a = np.zeros((L + 2, W, 4), np.uint8)
    cap, cap_hi = (H("#105aec"), H("#2868d8")) if kind == "blue" else (H("#f85070"), H("#f0648c"))
    for y in range(1, L + 1):
        s = y - 1            # 0 = top
        if s < 4:      row = [cap_hi, cap, cap]
        elif s < 5:    row = [H("#c5c2c2"), H("#c5c2c2"), H("#96969e")]
        elif s < L - 6: row = [H("#f8e008"), H("#f8a808"), H("#f8b828")]
        elif s < L - 2: row = [H("#e8c496")] * 3 if s < L - 4 else [None, H("#e8c496"), None]
        else:
            core = [H("#f04048"), H("#46c860")] if kind == "blue" else [H("#403e46"), H("#403e46")]
            row = [None, core[s - (L - 2)], None]
        for i, c in enumerate(row):
            if c is not None: a[y, 1 + i, :3] = c; a[y, 1 + i, 3] = 255
    op = a[..., 3] > 0
    ring = ndimage.binary_dilation(op, [[0, 1, 0], [1, 1, 1], [0, 1, 0]]) & ~op
    a[ring, :3] = INK; a[ring, 3] = 255
    return a
if __name__ == "__main__" and sys.argv[1] == "items":
    stage = sys.argv[2]; D = SP + "turn/"
    im, bx = B.components(RAW + "a4_items_t1.png"); big = [b for b in bx if b[3] - b[1] > 40]
    meta = json.load(open(D + "turnaround.json"))
    for name, who, i in ITEMS:
        pal = palette(who)
        for v, b in zip(("front", "side"), (big[i], big[i + 1])):
            crop = im[b[1] - 4:b[3] + 4, b[0] - 4:b[2] + 4].copy(); crop[..., 3] = np.where(crop[..., 3] >= 128, 255, 0)
            sp = P.pixelize(crop, ITEM_SCALE, pal, dark_boost=1.3, fit_phase=True, inner=0.6, min_blob=2)
            a = sp[..., 3] > 0; yy = np.nonzero(a.any(1))[0]; xx = np.nonzero(a.any(0))[0]; sp = sp[yy[0]:yy[-1] + 1, xx[0]:xx[-1] + 1]
            n = f"{name}_{v}"; Image.fromarray(sp).save(D + n + ".png")
            meta["items"][n] = dict(file="turn/" + n + ".png", size=[sp.shape[1], sp.shape[0]], pivot=[sp.shape[1] // 2, sp.shape[0] - 1],
                                    note="orthographic, same scale as the hero turnarounds; pivot = bottom centre")
            print(n, sp.shape[1::-1])
    for kind in ("blue", "pink"):
        p_ = pencil(kind)
        for v in ("front", "side"):
            n = f"item_pencil_{kind}_{v}"; Image.fromarray(p_).save(D + n + ".png")
            meta["items"][n] = dict(file="turn/" + n + ".png", size=[p_.shape[1], p_.shape[0]], pivot=[2, p_.shape[0] // 2],
                                    note=("blue cap, yellow body, sharpened tip with RAINBOW core" if kind == "blue" else
                                          "pink/orange cap, yellow body, sharpened tip with GRAPHITE core") +
                                         "; cap at the top, tip at the bottom; round body so front == side; length matches Jade's hair pencils")
            print(n, p_.shape[1::-1])
    json.dump(meta, open(D + "turnaround.json", "w"), indent=1)

if __name__ == "__main__" and sys.argv[1] == "review":
    from PIL import ImageDraw, ImageFont
    D = SP + "turn/"; meta = json.load(open(D + "turnaround.json")); z = 6
    try: FONT = ImageFont.truetype(R + "/engine/assets/fonts/Inter.ttf", 18)
    except OSError: FONT = ImageFont.load_default()
    heroes = ["charlie", "ricky", "jade_up", "jade_down"]
    W = 3 * (FW * z + 16) + 32; Hh = len(heroes) * (FH * z + 40) + 420
    c = Image.new("RGB", (W, Hh), (30, 32, 40)); d = ImageDraw.Draw(c); y = 10
    for h in heroes:
        for i, v in enumerate(VIEWS):
            n = f"turn_{h}_{v}"; im = Image.open(D + n + ".png").convert("RGBA")
            bg = Image.new("RGBA", im.size, (104, 122, 140, 255)); bg.alpha_composite(im); t = bg.resize((FW * z, FH * z), Image.NEAREST)
            td = ImageDraw.Draw(t)
            td.line([0, BASE * z + z, FW * z, BASE * z + z], fill=(255, 60, 200), width=2)               # baseline (under sole row)
            td.line([CX * z + z // 2, 0, CX * z + z // 2, FH * z], fill=(60, 255, 200), width=1)          # centre line
            td.line([0, (BASE + 1 - HT) * z, FW * z, (BASE + 1 - HT) * z], fill=(255, 220, 90), width=1)  # 80 px height
            x = 16 + i * (FW * z + 16); c.paste(t.convert("RGB"), (x, y + 24)); d.text((x, y), n, fill=(255, 220, 90), font=FONT)
        y += FH * z + 40
    x = 16; d.text((16, y), "items (same scale), front | side", fill=(255, 220, 90), font=FONT); y += 26
    for n in meta["items"]:
        im = Image.open(D + n + ".png").convert("RGBA"); bg = Image.new("RGBA", im.size, (104, 122, 140, 255)); bg.alpha_composite(im)
        t = bg.resize((im.width * z, im.height * z), Image.NEAREST); c.paste(t.convert("RGB"), (x, y)); x += t.width + 14
    c.save(R + "/assets/sheets/review/a4_turnarounds_x6.png"); print(c.size)
