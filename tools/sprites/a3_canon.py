"""A-3 canon pass on the installed Jade _hi strips (coordinator review 2026-10-15). Edits assets/sprites/jade_*_hi.png in place
(pre-pass copies in assets/sheets/bak/a3_pre_canon/; re-run from those: --from-bak).
 1. hair-UP strips: old 1x pencil pixels removed; a round bun drawn at the top-back of the head; two pencils drawn at 2x
    THROUGH it in an X: crossing hidden inside the bun (nothing drawn over hair or bun), caps (blue / pink) out one side,
    continuous yellow bodies, sharpened tips (blue-cap = rainbow core, pink-cap = graphite) out the other side, behind the head.
 2. jade_back_hi: RARE EARTH in a 3x5 pixel font under the big pale-blue dot.
 3. hair-DOWN strips: the model-added grey/orange over-ear headphones reverted to the 1x (Scale2x) pixels.
Usage: a3_canon.py [--from-bak]"""
import sys, os, json, math, shutil
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scale2x as S2
R = "/home/jade/Documents/vibesong"; SP = R + "/assets/sprites/"; BAK = R + "/assets/sheets/bak/a3_pre_canon/"
META = json.load(open(SP + "sprites.json"))["sprites"]
def H(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.uint8)
INK, HAIR, HAIR_HI = H("#141014"), H("#272123"), H("#3b3130")
YEL, YEL_HI, YEL_LO, WOOD, FERR = H("#f8a808"), H("#f8e008"), H("#f8b828"), H("#e8c496"), H("#c5c2c2")
BLUE, BLUE_HI, PINK, PINK_HI, GRAPH = H("#105aec"), H("#2868d8"), H("#f85070"), H("#f0648c"), H("#403e46")
RAINBOW = [H("#f04048"), H("#f8e008"), H("#46c860"), H("#2868d8")]
PENCIL = np.array([H(h) for h in ("#08b808", "#105aec", "#2868d8", "#46c860", "#f04048", "#f0648c", "#f85070", "#f8a808",
                                  "#f8b828", "#f8e008", "#e8c496")]).astype(int)
def is_pencil(rgb): return (np.abs(rgb[..., None, :].astype(int) - PENCIL).sum(-1) < 12).any(-1)
def ref_of(name, k):
    m = META[name[:-3]]; low = np.array(Image.open(SP + m["file"]).convert("RGBA"))
    f = low[:, k * m["frame_w"]:(k + 1) * m["frame_w"]].copy(); f[f[..., 3] == 0] = 0
    return S2.scale2x(f)

# ------------------------------------------------------------------ 1. bun + X pencils
def bun_and_pencils(f, view):
    op = f[..., 3] > 0; Hh, Ww = op.shape
    pen = is_pencil(f[..., :3]) & op
    ys, xs = np.nonzero(pen & (np.arange(Hh)[:, None] < 30))
    capx = xs.mean() if len(xs) else Ww / 2
    # remove the old pencils and every stray saturated pixel on the head (old tips/caps the model smeared into the hair):
    # inside the hair they become hair, sticking out they become background. Skin, mouth, eye and light-blue pixels stay.
    rows0 = np.nonzero(op.any(1))[0][0]
    rgb = f[..., :3].astype(int); sat = rgb.max(-1) - rgb.min(-1)
    keep = np.zeros(op.shape, bool)
    keep_cols = ("#f9b878", "#e9815d", "#f19c6a", "#ec6052", "#f80808", "#60a0f4", "#6eaaf0", "#f9f8f8", "#c5c2c2", "#96969e")
    if view == "back": keep_cols = keep_cols[:3]           # no face from behind: greys/whites on the head are model debris
    for h in keep_cols:
        keep |= np.abs(rgb - H(h).astype(int)).sum(-1) < 30
    band = np.zeros_like(op); band[: rows0 + 28] = True
    lum = rgb.sum(-1)
    stray = op & band & (pen | ((sat > 60) & ~keep) | ((view == "back") & (lum > 300) & ~keep))
    for y, x in zip(*np.nonzero(stray)):
        nb = op[max(0, y - 1):y + 2, max(0, x - 1):x + 2] & ~stray[max(0, y - 1):y + 2, max(0, x - 1):x + 2]
        if nb.sum() >= 5: f[y, x, :3] = HAIR
        else: f[y, x] = 0
    op = f[..., 3] > 0
    # drop detached specks (the old floating tip) and thin nubs left by the old caps
    lab, n = ndimage.label(op, structure=np.ones((3, 3)))
    if n > 1:
        big = np.argmax(np.bincount(lab.ravel())[1:]) + 1
        for i in range(1, n + 1):
            if i != big and (lab == i).sum() < 40: f[lab == i] = 0
    op = f[..., 3] > 0
    top_band = np.zeros_like(op); top_band[:26] = True
    opened = ndimage.binary_opening(op, structure=np.ones((3, 3)))
    f[op & ~opened & top_band] = 0
    op = f[..., 3] > 0
    # bun placement
    rows = np.nonzero(op.any(1))[0]; y_top = rows[0]
    if view == "back":
        bx, by, r = int(round(capx)), y_top + 1, 6
    else:
        band = op[y_top + 2:y_top + 12]; x_back = np.nonzero(band.any(0))[0].min()
        bx, by, r = max(x_back + 5, int(capx) - 3), y_top + 1, 6
    yy, xx = np.mgrid[:Hh, :Ww]; disk = (xx - bx) ** 2 + (yy - by) ** 2 <= r * r + 1
    add = disk & ~op
    f[add, :3] = HAIR; f[add, 3] = 255
    sheen = disk & ((xx - bx) ** 2 + (yy - by) ** 2 >= (r - 2.2) ** 2) & ((xx - bx) ** 2 + (yy - by) ** 2 <= (r - 1) ** 2) & (yy < by) & (xx < bx + 2)
    f[sheen, :3] = HAIR_HI                                 # crescent sheen: the bun reads as a round knot
    # bun outline where it meets the background + a dark ring line where it sits on the head
    op = f[..., 3] > 0
    ring = disk & ~ndimage.binary_erosion(disk, [[0, 1, 0], [1, 1, 1], [0, 1, 0]])
    edge_bg = op & ~ndimage.binary_erosion(op, [[0, 1, 0], [1, 1, 1], [0, 1, 0]], border_value=0)
    f[ring, :3] = INK                                    # full ring: the bun reads as its own shape on the head
    solid = op.copy()                                   # head + bun: pencils are never drawn over these
    # the X: (cap angle, tip = cap + 180) per pencil; angles in degrees, y up
    if view == "back": X = [("blue", 160), ("pink", 200)]      # caps out the left, tips out the right, X in the bun
    else:              X = [("blue", 18), ("pink", 52)]         # caps up/forward, tips out behind/below the bun
    layer = np.zeros_like(f); owner = np.zeros(op.shape, int)
    for pi, (kind, ang) in enumerate(X):
        a = math.radians(ang); d = np.array([math.cos(a), -math.sin(a)]); nrm = np.array([-d[1], d[0]])
        Lc, Lt = r + 4, r + 6
        for s10 in range(-Lt * 10, Lc * 10 + 1, 3):
            s = s10 / 10
            for w in (-0.45, 0.45):
                px = bx + 0.5 + s * d[0] + w * nrm[0]; py = by + 0.5 + s * d[1] + w * nrm[1]
                x, y = int(math.floor(px)), int(math.floor(py))
                if not (0 <= x < Ww and 0 <= y < Hh) or solid[y, x]: continue
                if s > Lc - 3:   c = (BLUE if kind == "blue" else PINK) if w < 0 or s > Lc - 1.5 else (BLUE_HI if kind == "blue" else PINK_HI)
                elif s > Lc - 4: c = FERR
                elif s > -Lt + 4: c = YEL_HI if w < 0 else YEL
                elif s > -Lt + 2: c = WOOD
                else:            c = RAINBOW[int((w + 0.5) * 2 + (s * 2)) % 4] if kind == "blue" else GRAPH
                if owner[y, x] and owner[y, x] != pi + 1: continue
                layer[y, x, :3] = c; layer[y, x, 3] = 255; owner[y, x] = pi + 1
    lm = layer[..., 3] > 0
    f[lm] = layer[lm]
    # 1-px outline around the pencils where they meet the background
    op = f[..., 3] > 0
    ring = ndimage.binary_dilation(lm, structure=np.ones((3, 3))) & ~op
    f[ring, :3] = INK; f[ring, 3] = 255
    return f

# ------------------------------------------------------------------ 2. RARE EARTH under the back dot
F34 = {"R": ["110", "101", "110", "101"], "A": ["010", "101", "111", "101"], "E": ["111", "110", "100", "111"],
       "T": ["111", "010", "010", "010"], "H": ["101", "111", "101", "101"]}
WHITE, DOT = H("#f9f8f8"), H("#6eaaf0")
def rare_earth(f):
    """big back dot + RARE / EARTH (tools/sprites/backdot.py)."""
    import backdot
    rgb = f[..., :3].astype(int)
    dot = ((np.abs(rgb - H("#60a0f4").astype(int)).sum(-1) < 40) | (np.abs(rgb - H("#6eaaf0").astype(int)).sum(-1) < 40)) & (f[..., 3] > 0)
    ys, xs = np.nonzero(dot); cx = int(round(xs.mean())); y0 = int(ys.min())
    white = (np.abs(rgb - H("#f9f8f8").astype(int)).sum(-1) < 30) & (f[..., 3] > 0)
    top = y0
    while top > 0 and white[top - 1, cx - 4:cx + 5].sum() >= 6: top -= 1
    return backdot.back_dot(f, top, cx, 12)

# ------------------------------------------------------------------ 3. headphones off the hair-down strips
HP = np.array([H(h) for h in ("#96969e", "#c5c2c2", "#403e46", "#3d373b", "#2b2b36", "#f87008", "#d75e0b", "#b64d0f")]).astype(int)
def in_hp(rgb): return (np.abs(rgb[..., None, :].astype(int) - HP).sum(-1) < 14).any(-1)
def no_headphones(f, ref):
    op = f[..., 3] > 0; rows = np.nonzero(op.any(1))[0]; y0 = rows[0]
    head = np.zeros_like(op); head[: y0 + 30] = True
    bad = op & head & in_hp(f[..., :3]) & ~in_hp(ref[..., :3]) & (ref[..., 3] > 0)
    # revert a 2-px neighbourhood too, so the dark ear-cup rings and the head band go with the grey/orange fill
    area = ndimage.binary_dilation(bad, iterations=2) & op & head & (ref[..., 3] > 0)
    f[area, :3] = ref[area, :3]
    return int(bad.sum())

if __name__ == "__main__":
    up = {"jade_idle_hi": "side", "jade_run_hi": "side", "jade_jump_hi": "side", "jade_victory_hi": "side", "jade_back_hi": "back"}
    down = ["jade_run_hairdown_hi", "jade_draw_rainbow_hi", "jade_draw_graphite_hi", "jade_sing_hi", "jade_drum_hi"]
    for n in list(up) + down:
        src = (BAK if "--from-bak" in sys.argv else SP) + n + ".png"
        a = np.array(Image.open(src).convert("RGBA")); m = META[n]; W = m["frame_w"]
        out = []
        for k in range(m["frames"]):
            f = a[:, k * W:(k + 1) * W].copy()
            if n in up:
                f = bun_and_pencils(f, up[n])
                if n == "jade_back_hi": print(n, "RARE EARTH rows", rare_earth(f))
            else:
                print(n, k, "headphone px reverted:", no_headphones(f, ref_of(n, k)))
            out.append(f)
        Image.fromarray(np.concatenate(out, 1)).save(SP + n + ".png")
    print("ok")
