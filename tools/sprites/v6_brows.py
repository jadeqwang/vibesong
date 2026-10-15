"""v6 brow variants on v5 paper sheets (procedural, no model).
A: trim bottom another ~12.5% (top anchored) + recolor to the hair mid-tone (never darker than the hair).
B: transfer Jade's real pencil brows from jade_trace_jacket_hp_1.jpg: segment trace brows, similarity transform from the
   trace eye corners to the paper eye corners (per eye), then shift vertically so (upper-lid -> brow-bottom gap)/eye width
   equals the trace's; recolor to hair mid-tone and multiply-composite (pencil texture kept).
   Expressive panels (brows raised/furrowed) instead fit the trace brow onto the v5 brow's endpoints, keeping the expression.
Also measures the brow-to-eye gap ratio."""
import sys, json, numpy as np, cv2
from PIL import Image
from scipy import ndimage
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/sprites")
import v5_brows as B5, v5warp as W
V = "/home/jade/Documents/vibesong/assets/sheets/"
TRACE = "/home/jade/Documents/1-music-shipped/orbital-sunrise-video/media/chars/jade_src/jade_trace_jacket_hp_1.jpg"
# anatomical sides (MediaPipe indices): R = subject's right (image-left in a front view)
SIDE = {"R": dict(brow=B5.BROWS["A"], inner=133, outer=33, lid=159), "L": dict(brow=B5.BROWS["B"], inner=362, outer=263, lid=386)}

def gap_ratio(M, Lm, s):
    """(upper-lid y - brow bottom y at the lid's x) / eye width; M = brow mask."""
    S = SIDE[s]; lx, ly = Lm[S["lid"]]; ew = np.linalg.norm(Lm[S["inner"]] - Lm[S["outer"]])
    xs = np.arange(int(lx) - 2, int(lx) + 3); bots = [np.nonzero(M[:, x])[0].max() for x in xs if M[:, x].any()]
    if not bots: return None
    return round(float((ly - np.median(bots)) / ew), 3)

def hair_tone(a, box, Lm):
    """Median colour of mid-dark hair pixels around the forehead/temples."""
    x0, y0, x1, y1 = box
    top = int(Lm[10, 1]); fw = np.linalg.norm(Lm[234] - Lm[454])
    ys, ye = max(int(top - 0.15 * fw), 0), int(Lm[159, 1])
    xs, xe = max(int(Lm[234, 0] - 0.1 * fw), 0), int(Lm[454, 0] + 0.1 * fw)
    reg = a[ys:ye, xs:xe].reshape(-1, 3); lum = reg.mean(-1)
    hair = reg[lum < 90]
    if len(hair) < 50: hair = reg[lum < np.percentile(lum, 10)]
    l = hair.mean(-1); mid = hair[(l > np.percentile(l, 35)) & (l < np.percentile(l, 65))]
    return mid.mean(0)

def recolor(a, M, hair, skin_col):
    """Brow pixels: alpha from darkness, colour lerps skin -> hair tone (so never darker than the hair)."""
    lum = a.mean(-1); sk = skin_col.mean()
    dark = np.percentile(lum[M], 5)
    al = np.clip((sk - lum) / max(sk - dark, 1), 0, 1)
    Md = ndimage.binary_dilation(M, iterations=1)
    al = np.where(Md, al, 0)[..., None]
    a[:] = np.where(Md[..., None], skin_col * (1 - al) + hair * al, a)
    return a

# ---------------------------------------------------------------- trace brows
def trace_brows():
    t = np.array(Image.open(TRACE).convert("RGB")).astype(np.float32)
    Lm = B5.landmarks(t, (0, 0, t.shape[1], t.shape[0]), up=1)
    lum = t.mean(-1); out = {}
    for s, S in SIDE.items():
        P = Lm[S["brow"]]
        hull = np.zeros(lum.shape, np.uint8); cv2.fillPoly(hull, [cv2.convexHull(P.astype(np.float32)).astype(np.int32)], 1)
        reg = ndimage.binary_dilation(hull.astype(bool), iterations=26)
        lidy = Lm[S["lid"]][1]; reg[int(P[:, 1].max() + 0.35 * (lidy - P[:, 1].max())):] = False   # stay clear of eyelid/glasses
        paper = np.percentile(lum[reg], 90)
        al = np.clip((paper - 28 - lum) / (paper - 28 - 70), 0, 1) * reg
        core = ndimage.binary_opening(al > 0.45, iterations=1)
        lab, n = ndimage.label(ndimage.binary_dilation(core, iterations=3))
        k = np.argmax(ndimage.sum(core, lab, range(1, n + 1))) + 1 if n else 0
        keep = ndimage.binary_dilation(lab == k, iterations=2)
        al = al * keep; al[al < 0.18] = 0
        al = np.clip(al / max(np.percentile(al[al > 0], 92), 0.3), 0, 1)   # densest strokes -> full hair tone
        M = al > 0.45
        out[s] = dict(alpha=al, mask=M, Lm=Lm, gap=gap_ratio(M, Lm, s))
    return t, Lm, out

def place(alpha, Lsrc, Ldst, s, gap_target=None, Mdst=None, mode="eye"):
    S = SIDE[s]
    if mode == "eye":
        src = np.float32([Lsrc[S["inner"]], Lsrc[S["outer"]]]); dst = np.float32([Ldst[S["inner"]], Ldst[S["outer"]]])
    A = cv2.estimateAffinePartial2D(src, dst)[0] if mode == "eye" else None
    if mode == "fit":   # fit trace brow ends onto the v5 brow ends (keeps the expression)
        def ends(M, s, L):
            ys, xs = np.nonzero(M); inner_left = L[S["inner"]][0] > L[S["outer"]][0]
            # inner end = end nearer the face midline
            i1 = np.argmin(xs) if not inner_left else np.argmax(xs)
            o1 = np.argmax(xs) if not inner_left else np.argmin(xs)
            def endpt(i): x = xs[i]; c = ys[np.abs(xs - x) <= 2]; return [x, c.mean()]
            return np.float32([endpt(i1), endpt(o1)])
        A = cv2.estimateAffinePartial2D(ends(alpha > 0.45, s, Lsrc), ends(Mdst, s, Ldst))[0]
    H, Wd = Ldst.shape[0], None
    return A

def warp_alpha(alpha, A, shape):
    return cv2.warpAffine(alpha.astype(np.float32), A, (shape[1], shape[0]), flags=cv2.INTER_LINEAR, borderValue=0)

def variantB(a, box, Lm, tdata, mode, log, v1=None, render="v6"):
    hair = hair_tone(a, box, Lm)
    for s in ("R", "L"):
        P = Lm[SIDE[s]["brow"]]
        Mv5, skin = W.tight_mask(a, P)
        if Mv5 is None: log.append((s, "no v5 brow")); continue
        Mgeo = Mv5
        if v1 is not None:   # swap in the ORIGINAL v1 pixels around the brow (v1 brows are thin -> clean erase)
            hull = np.zeros(Mv5.shape, np.uint8); cv2.fillPoly(hull, [cv2.convexHull(P.astype(np.float32)).astype(np.int32)], 1)
            near_ = ndimage.binary_dilation(Mv5 | hull.astype(bool), iterations=25)
            swm = ndimage.binary_dilation(near_ & (np.abs(a - v1).mean(-1) > 6), iterations=4) & near_
            sw = cv2.GaussianBlur(swm.astype(np.float32), (0, 0), 1.5)[..., None]
            a[:] = a * (1 - sw) + v1 * sw
            cols = B5.brow_columns(a, P)       # thin v1 brow: per-column dark run on the brow line (strand columns skipped)
            M1 = np.zeros(Mv5.shape, bool)
            lum1 = a.mean(-1)
            for x, (t_, b_, sk_) in cols.items():
                if lum1[max(t_ - 3, 0), x] < sk_ - 45 or lum1[b_ + 3, x] < sk_ - 45: continue   # a strand continues: not brow
                M1[t_:b_ + 1, x] = True
            colsx = M1.any(0); lab_, n_ = ndimage.label(colsx)
            for k_ in range(1, n_ + 1):
                if (lab_ == k_).sum() < 6: M1[:, lab_ == k_] = False      # isolated columns = strand bits
            if M1.sum() > 10: Mv5 = M1
        tb = tdata[s]
        A = place(tb["alpha"], tb["Lm"], Lm, s, Mdst=Mgeo, mode=mode)
        al = warp_alpha(tb["alpha"], A, a.shape[:2])
        if mode == "eye":   # enforce the trace gap ratio exactly
            M = al > 0.45; g = gap_ratio(M, Lm, s)
            if g is not None:
                ew = np.linalg.norm(Lm[SIDE[s]["inner"]] - Lm[SIDE[s]["outer"]])
                dy = (g - tb["gap"]) * ew            # positive -> current gap too big -> move down
                A2 = A.copy(); A2[1, 2] += dy; al = warp_alpha(tb["alpha"], A2, a.shape[:2])
        # erase the v5 brow, then multiply-composite the trace strokes in the hair tone
        ring = ndimage.binary_dilation(Mv5, iterations=8) & ~ndimage.binary_dilation(Mv5, iterations=3)
        rl = a[ring].mean(-1); skin_col = np.median(a[ring][rl > skin.mean() - 40] if (rl > skin.mean() - 40).sum() > 20 else a[ring], 0) if np.ndim(skin) else np.median(a[ring][rl > skin - 40], 0)
        if v1 is not None:
            er = ndimage.binary_dilation(Mv5, iterations=1)
        else:
            er = ndimage.binary_dilation(Mv5, iterations=2) & (a.mean(-1) < skin_col.mean() - 12)
            er = ndimage.binary_dilation(er, iterations=1) & ndimage.binary_dilation(Mv5, iterations=3)
        # keep hair strands that cross the brow: columns that are dark well above AND below the brow band
        lum_ = a.mean(-1); ys_, xs_ = np.nonzero(Mv5); th_ = max(3, int(np.median(np.bincount(xs_)[np.bincount(xs_) > 0])))
        for x in (np.unique(np.nonzero(er)[1]) if v1 is None else []):
            c = np.nonzero(er[:, x])[0]; t_, b_ = c.min(), c.max()
            up = lum_[max(t_ - th_ - 2, 0):t_ - 1, x]; dn = lum_[b_ + 2:b_ + th_ + 3, x]
            if up.size and dn.size and up.mean() < skin_col.mean() - 50 and dn.mean() < skin_col.mean() - 50:
                er[:, x] = False
        # inpaint from skin only: temporarily paint nearby hair/strand pixels with skin so they don't smear in
        near = ndimage.binary_dilation(er, iterations=6) & ~er
        hairpix = near & (a.mean(-1) < skin_col.mean() - 40)
        yb_ = np.nonzero(Mv5)[0].max()
        hairpix[yb_ - 1:] = False                       # never touch the eye/lid lines below the brow
        tmp = a.copy(); tmp[hairpix] = skin_col
        inp = cv2.inpaint(np.clip(tmp, 0, 255).astype(np.uint8), er.astype(np.uint8) * 255, 6, cv2.INPAINT_TELEA).astype(np.float32)
        # where the erased pixel sits inside hair (most non-erased neighbours dark), fill from the hair instead
        dk = (a.mean(-1) < skin_col.mean() - 60) & ~er
        frac = cv2.blur(dk.astype(np.float32), (7, 7)) / np.maximum(cv2.blur((~er).astype(np.float32), (7, 7)), 1e-3)
        inhair = er & (frac > 0.5)
        if render == "v7":       # never erase under hair: the old brow there is hidden in the hair anyway
            er = er & ~ndimage.binary_dilation(inhair, iterations=1); inhair[:] = False
            inp = cv2.inpaint(np.clip(tmp, 0, 255).astype(np.uint8), er.astype(np.uint8) * 255, 6, cv2.INPAINT_TELEA).astype(np.float32)
        if inhair.any():
            inp_h = cv2.inpaint(np.clip(a, 0, 255).astype(np.uint8), er.astype(np.uint8) * 255, 4, cv2.INPAINT_TELEA).astype(np.float32)
            inp[inhair] = inp_h[inhair]
        rng = np.random.default_rng(1); inp += rng.normal(0, 1.5, inp.shape)
        soft = cv2.GaussianBlur(er.astype(np.float32), (0, 0), 0.8)[..., None]
        a[:] = a * (1 - soft) + inp * soft
        if render == "v7":
            import v7_draw
            inner_x = Lm[SIDE[s]["inner"]][0]
            a[:] = v7_draw.draw(a, al, hair, skin_col, inner_x, seed=hash((box, s)) % 1000, straight=(s == 'R'))
            log.append((s, mode, "gap", gap_ratio(v7_draw.LAST_MASK, Lm, s)))
            continue
        al = np.clip(al, 0, 1) ** 0.6          # downscaled pencil strokes go sub-pixel; restore their weight
        fac = 1 - al[..., None] * (1 - np.clip(hair / np.maximum(skin_col, 1), 0, 1))
        a[:] = a * fac
        log.append((s, mode, "gap", gap_ratio(al > 0.45, Lm, s)))
    return a

def variantA(a, box, Lm, log, trim=0.125):
    hair = hair_tone(a, box, Lm)
    for s in ("R", "L"):
        P = Lm[SIDE[s]["brow"]]
        M, skin = W.tight_mask(a, P)
        if M is None: continue
        X, top, bot = W.curves(M)
        newbot = bot - trim * (bot - top + 1)
        cut = np.zeros(M.shape, bool)
        for i, x in enumerate(X): cut[int(np.ceil(newbot[i])) + 1:int(bot[i]) + 2, x] = True
        cut &= ndimage.binary_dilation(M, iterations=1)
        a[:] = cv2.inpaint(np.clip(a, 0, 255).astype(np.uint8), ndimage.binary_dilation(cut, iterations=1).astype(np.uint8) * 255, 3, cv2.INPAINT_TELEA).astype(np.float32)
        M2 = M & ~cut
        ring = ndimage.binary_dilation(M, iterations=7) & ~ndimage.binary_dilation(M, iterations=3)
        a[:] = recolor(a, M2, hair, np.median(a[ring], 0))
        log.append((s, "A gap", gap_ratio(W.tight_mask(a, P)[0], Lm, s)))
    return a

def measure(a, box, Lm):
    r = {}
    for s in ("R", "L"):
        M, _ = W.tight_mask(a, Lm[SIDE[s]["brow"]]); r[s] = gap_ratio(M, Lm, s) if M is not None else None
    return r

V1 = {"turn": "raw/paper_jade_turn_t1.png", "expr": "raw/paper_expr_jade_t2.png", "lineup": "raw/paper_lineup_nbp_t1.jpg"}
SHEETS = [("turn", "paper/paper_jade_turnaround.png", [((250, 140, 520, 420), "eye"), ((880, 140, 1160, 420), "eye")]),
          ("expr", "paper/paper_expr_jade.png", [((c * 917, r * 768, c * 917 + 917, r * 768 + 768), "eye" if (r, c) in ((0, 0), (0, 1)) else "fit")
                                                  for r in range(2) for c in range(3)]),
          ("lineup", "paper/paper_lineup.png", [((450, 150, 700, 400), "eye")])]

def main_v7():
    t, tLm, tdata = trace_brows()
    for nm, src, faces in SHEETS:
        base = np.array(Image.open(V + src).convert("RGB")).astype(np.float32); C = base.copy()
        v1 = np.array(Image.open(V + V1[nm]).convert("RGB").resize((base.shape[1], base.shape[0]), Image.LANCZOS)).astype(np.float32)
        for i, (box, mode) in enumerate(faces):
            Lm = B5.landmarks(base, box)
            if Lm is None: print("noface", nm, box); continue
            log = []; C = variantB(C, box, Lm, tdata, mode, log, v1=v1, render="v7"); print("v7", nm, i, mode, log)
        Image.fromarray(np.clip(C, 0, 255).astype(np.uint8)).save(V + f"v6/{nm}_v7.png")

if __name__ == "__main__" and len(sys.argv) > 1 and sys.argv[1] == "v7":
    main_v7(); sys.exit()
if __name__ == "__main__":
    t, tLm, tdata = trace_brows()
    gaps = {"trace": {s: tdata[s]["gap"] for s in "RL"}}
    dbg = np.zeros(t.shape[:2]); [dbg.__iadd__(tdata[s]["alpha"]) for s in "RL"]
    Image.fromarray((255 - np.clip(dbg, 0, 1) * 255).astype(np.uint8)).crop((400, 700, 1300, 1050)).save(V + "v6/trace_brows_extracted.png")
    for nm, src, faces in SHEETS:
        base = np.array(Image.open(V + src).convert("RGB")).astype(np.float32)
        A_img, B_img = base.copy(), base.copy()
        v1 = np.array(Image.open(V + V1[nm]).convert("RGB").resize((base.shape[1], base.shape[0]), Image.LANCZOS)).astype(np.float32)
        for i, (box, mode) in enumerate(faces):
            Lm = B5.landmarks(base, box)
            if Lm is None: print("noface", nm, box); continue
            log = []
            gaps[f"{nm}{i}_v5"] = measure(base, box, Lm)
            A_img = variantA(A_img, box, Lm, log); gaps[f"{nm}{i}_v6A"] = measure(A_img, box, Lm)
            B_img = variantB(B_img, box, Lm, tdata, mode, log, v1=v1); gaps[f"{nm}{i}_v6B"] = measure(B_img, box, Lm)
            print(nm, i, mode, log)
        Image.fromarray(np.clip(A_img, 0, 255).astype(np.uint8)).save(V + f"v6/{nm}_v6A.png")
        Image.fromarray(np.clip(B_img, 0, 255).astype(np.uint8)).save(V + f"v6/{nm}_v6B.png")
    json.dump(gaps, open(V + "v6/gaps.json", "w"), indent=1); print(json.dumps(gaps))
