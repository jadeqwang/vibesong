"""A-3: 2x-density (_hi) hero strips for the voxel heroes.

Method (per batch of strips):
  1. compose: the existing low-res frames, NEAREST-upscaled Z x per old texel (Z=16 -> 8 output px per new texel), laid out
     on a flat-grey 16:9 canvas the size of a nano-banana-pro 4K output (5504x3072). -> raw/a3_<tag>_in.png + layout json
  2. nano-banana-pro redraws it at 2x pixel density, same canvas, same poses (tools/sprites/g.py, tag art11_hi_*).
  3. extract: per frame, register the model frame to the upscaled original (small shift search), sample each new texel
     (Z/2 output px) by the median of its central cells, alpha = Scale2x of the low-res alpha (silhouette, pose and anchor
     stay exactly 2x the low-res strip), palette = the hero's palette + a few in-between shades, 1-px interior outline.
Usage:
  a3_hi.py compose TAG strip[,strip...]          (writes assets/sheets/raw/a3_TAG_in.png + .json)
  a3_hi.py extract TAG MODEL_PNG STAGE_DIR [--extra=N]
"""
import sys, os, json, glob
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scale2x as S2
R = "/home/jade/Documents/vibesong"; SP = R + "/assets/sprites/"; RAW = R + "/assets/sheets/raw/"
CW, CH = 5504, 3072; BG = (180, 188, 200)
META = json.load(open(SP + "sprites.json"))["sprites"]

def compose(tag, names, Z=16, gap=24):
    cv = Image.new("RGB", (CW, CH), BG); lay = {"Z": Z, "frames": []}
    x, y, rowh = gap, gap, 0
    for n in names:
        m = META[n]; im = Image.open(SP + m["file"]).convert("RGBA")
        for k in range(m["frames"]):
            fr = im.crop((k * m["frame_w"], 0, (k + 1) * m["frame_w"], m["frame_h"]))
            w, h = fr.width * Z, fr.height * Z
            if x + w > CW - gap: x, y, rowh = gap, y + rowh + gap, 0
            assert y + h <= CH - gap, f"canvas full at {n}:{k}"
            big = fr.resize((w, h), Image.NEAREST); cv.paste(big, (x, y), big)
            lay["frames"].append(dict(name=n, k=k, x=x, y=y, w=fr.width, h=fr.height)); x += w + gap; rowh = max(rowh, h)
    cv.save(RAW + f"a3_{tag}_in.png"); json.dump(lay, open(RAW + f"a3_{tag}_in.json", "w"), indent=0)
    print(RAW + f"a3_{tag}_in.png", len(lay["frames"]), "frames")

def hero_of(n): return n.split("_")[0]
def hero_palette(who):
    cols = set()
    for f in glob.glob(SP + who + "_*.png"):
        if "_hi" in f or "_x2" in f: continue
        a = np.array(Image.open(f).convert("RGBA")); cols |= set(map(tuple, a[a[..., 3] > 0][:, :3]))
    return np.array(sorted(cols), int)

def extract(tag, model_png, stage, n_extra=10):
    lay = json.load(open(RAW + f"a3_{tag}_in.json")); Z = lay["Z"]; t = Z // 2
    mod = np.array(Image.open(model_png).convert("RGB").resize((CW, CH), Image.LANCZOS)).astype(int)
    bgv = np.array(BG)
    out = {}; pals = {}
    for fr in lay["frames"]:
        n, k = fr["name"], fr["k"]; m = META[n]; who = hero_of(n)
        if who not in pals: pals[who] = hero_palette(who)
        low = np.array(Image.open(SP + m["file"]).convert("RGBA"))[:, k * m["frame_w"]:(k + 1) * m["frame_w"]].copy()
        low[low[..., 3] == 0] = 0
        hi_ref = S2.scale2x(low)                                   # 2x silhouette + reference colours
        H2, W2 = hi_ref.shape[:2]; alpha = hi_ref[..., 3] > 0
        # registration: shift (in output px) that best matches the model's non-background mask to the 2x silhouette
        best = (-1, 0, 0)
        for dy in range(-12, 13, 2):
            for dx in range(-12, 13, 2):
                y0, x0 = fr["y"] + dy, fr["x"] + dx
                crop = mod[y0 + t // 2:y0 + H2 * t:t, x0 + t // 2:x0 + W2 * t:t]
                if crop.shape[:2] != (H2, W2): continue
                fg = np.abs(crop - bgv).sum(-1) > 40
                sc = (fg == alpha).mean()
                if sc > best[0]: best = (sc, dx, dy)
        _, dx, dy = best
        y0, x0 = fr["y"] + dy, fr["x"] + dx
        reg = mod[y0:y0 + H2 * t, x0:x0 + W2 * t].reshape(H2, t, W2, t, 3)
        c0, c1 = t // 4, t - t // 4
        cell = np.median(reg[:, c0:c1, :, c0:c1].transpose(0, 2, 1, 3, 4).reshape(H2, W2, -1, 3), axis=2)   # central half of each texel
        # where the model drew background inside the silhouette, fall back to the Scale2x colour
        bgcell = np.abs(cell - bgv).sum(-1) < 30
        cell[bgcell] = hi_ref[..., :3][bgcell]
        out.setdefault(n, {})[k] = (cell, alpha, best[0])
    # palette per hero: own colours + the most used in-between shades
    for who in pals:
        P = pals[who]
        cand = []
        for i in range(len(P)):
            for j in range(i + 1, len(P)):
                d = np.abs(P[i] - P[j]).sum()
                if 24 < d < 110: cand.append((P[i] + P[j]) // 2)
        cand = np.array(cand) if cand else np.zeros((0, 3), int)
        allp = np.concatenate([P, cand]) if len(cand) else P
        cells = np.concatenate([c[0][c[1]] for n in out if hero_of(n) == who for c in out[n].values()])
        idx = np.argmin(((cells[:, None, :] - allp[None]) ** 2).sum(-1), 1)
        used = np.bincount(idx, minlength=len(allp))[len(P):]
        keep = [len(P) + i for i in np.argsort(-used)[:n_extra] if used[i] > 30]
        pals[who] = np.concatenate([P, allp[keep]]) if keep else P
        print(who, "palette", len(P), "+", len(keep), "shades")
    os.makedirs(stage, exist_ok=True)
    res = {}
    for n, fs in out.items():
        P = pals[hero_of(n)]; ink = P[np.argmin(P.sum(1))]
        frames = []
        for k in sorted(fs):
            cell, alpha, sc = fs[k]
            idx = np.argmin(((cell[:, :, None, :] - P[None, None]) ** 2).sum(-1), -1)
            img = P[idx]
            # despeckle: a pixel unlike all 4 neighbours that agree on one colour takes that colour
            for _ in range(1):
                pad = np.pad(idx, 1, mode="edge"); nb = np.stack([pad[:-2, 1:-1], pad[2:, 1:-1], pad[1:-1, :-2], pad[1:-1, 2:]])
                agree = (nb == nb[0]).all(0) & (idx != nb[0]); idx[agree] = nb[0][agree]; img = P[idx]
            a = np.zeros(alpha.shape + (4,), np.uint8); a[..., :3] = img; a[..., 3] = np.where(alpha, 255, 0)
            # interior 1-px outline on the silhouette edge (4-neighbourhood), like the low-res strips
            edge = alpha & ~ndimage.binary_erosion(alpha, [[0, 1, 0], [1, 1, 1], [0, 1, 0]], border_value=0)
            a[edge, :3] = ink
            a[~alpha] = 0
            frames.append(a); print(f"  {n}:{k} overlap {sc:.3f}")
        st = np.concatenate(frames, 1); Image.fromarray(st).save(f"{stage}/{n}_hi.png"); res[n] = len(frames)
    return res

if __name__ == "__main__":
    if sys.argv[1] == "compose": compose(sys.argv[2], sys.argv[3].split(","))
    elif sys.argv[1] == "extract":
        ex = [int(a.split("=")[1]) for a in sys.argv if a.startswith("--extra=")]
        print(extract(sys.argv[2], sys.argv[3], sys.argv[4], *(ex or [])))
