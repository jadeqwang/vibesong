"""Jade's jacket back: BIG pale-blue dot (the dominant shape of the back panel) with RARE / EARTH in small 3x3 capitals under it,
after costume/artwork/back_dot_and_lettering (lettering about as wide as the dot). Used by a3_canon.py (jade_back_hi) and
a4_turn.py (turn_jade_*_back). Only recolours pixels inside the silhouette; the back panel runs a few rows lower to fit."""
import numpy as np
def H(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.uint8)
INK, WHITE, DOT, DOT_LO = H("#141014"), H("#f9f8f8"), H("#60a0f4"), H("#6eaaf0")
F33 = {"R": ["110", "111", "101"], "A": ["010", "111", "101"], "E": ["111", "110", "111"],
       "T": ["111", "010", "010"], "H": ["101", "111", "101"]}
def back_dot(f, top, cx, d=12):
    """top = first jacket row of the back panel, cx = centre column. Dot: circle of diameter d from row `top`.
    Letters: RARE at top+d+1, EARTH at top+d+5 (3x3 glyphs, 1-px gaps), hem line under them."""
    rgb = f[..., :3].astype(int); op = f[..., 3] > 0
    old = op & ((np.abs(rgb - DOT.astype(int)).sum(-1) < 40) | (np.abs(rgb - DOT_LO.astype(int)).sum(-1) < 40))
    f[old, :3] = WHITE
    inside = op.copy(); inside[:, 1:-1] &= op[:, :-2] & op[:, 2:]
    yL0, yL1 = top + d, top + d + 7
    for y in range(top - 1, yL1 + 1):                       # clean white back panel (model lettering / folds painted out)
        for x in range(cx - 10, cx + 11):
            if inside[y, x]: f[y, x, :3] = WHITE
    for x in range(cx - 10, cx + 11):                       # hem under the panel
        if inside[yL1 + 1, x]: f[yL1 + 1, x, :3] = INK
    yy, xx = np.mgrid[:f.shape[0], :f.shape[1]]
    r = d / 2; cy = top + r - 0.5
    disk = ((xx - cx + (0.5 if d % 2 == 0 else 0)) ** 2 + (yy - cy) ** 2 <= r * r) & op
    f[disk, :3] = DOT
    f[disk & ((xx - cx) ** 2 + (yy - cy) ** 2 > (r - 1.2) ** 2) & (yy > cy), :3] = DOT_LO   # a 1-px lower rim shade
    y = yL0
    for ln in ("RARE", "EARTH"):
        x0 = cx - (4 * len(ln) - 1) // 2
        for ch in ln:
            for j, row in enumerate(F33[ch]):
                for i, v in enumerate(row):
                    if v == "1" and op[y + j, x0 + i]: f[y + j, x0 + i, :3] = INK
            x0 += 4
        y += 4
    return dict(dot_rows=[top, top + d - 1], dot_d=d, letters_rows=[yL0, yL0 + 6], centre_x=cx)
