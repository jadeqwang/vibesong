"""Build engine-ready pixel strips from AI pixel sheets.

Usage: build.py CONFIG.json   (see tools/sprites/heroes.json)
Config: {"out_dir": ..., "review_dir": ..., "sheets": [{"name", "src", "bg"?: [r,g,b], "target_h", "ref_box", "palette_n",
          "frame": [W, H], "anims": {anim: {"frames": [[box or comp idx...], ...], "frame"?: [W,H], "loop"?, "fps"?}}}]}
A frame spec is a list of boxes [x0,y0,x1,y1] in sheet px; their union is cropped (pixels outside those boxes are cleared).
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixelize as P

def load(sheet):
    im = np.array(Image.open(sheet["src"]).convert("RGBA"))
    if sheet.get("bg"):
        d = np.abs(im[..., :3].astype(int) - np.array(sheet["bg"])).sum(-1)
        im[..., 3] = np.where(d > sheet.get("bg_tol", 60), 255, 0)
    # drop soft glow: anything below alpha 128 is background
    im[..., 3] = np.where(im[..., 3] >= 128, 255, 0)
    return im

def crop(im, boxes):
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes); x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
    c = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    for b in boxes:
        c[b[1] - y0:b[3] - y0, b[0] - x0:b[2] - x0] = im[b[1]:b[3], b[0]:b[2]]
    return c

def head_cx(sp):
    a = sp[..., 3] > 0
    ys = np.nonzero(a.any(1))[0]
    if not len(ys): return sp.shape[1] / 2
    top = a[ys[0]: ys[0] + max(4, int((ys[-1] - ys[0]) * 0.35))]
    xs = np.nonzero(top)[1]
    return xs.mean() if len(xs) else sp.shape[1] / 2

def place(sp, W, H, align="head"):
    out = np.zeros((H, W, 4), np.uint8)
    h, w = sp.shape[:2]
    cx = head_cx(sp) if align == "head" else w / 2
    ox = int(round(W / 2 - cx)); oy = H - h
    ox = min(max(ox, W - w if w > W else 0), 0 if w > W else W - w)
    ys0, xs0 = max(0, -oy), max(0, -ox)
    out[max(oy, 0):max(oy, 0) + h - ys0, max(ox, 0):max(ox, 0) + w - xs0] = sp[ys0:h, xs0:w][: H - max(oy, 0), : W - max(ox, 0)]
    if w > W or h > H: print(f"   ! sprite {w}x{h} clipped into {W}x{H}")
    return out

def build(cfg):
    meta = {"generated_by": "tools/sprites/build.py", "pixel_scale_note": "1 texel = 1 game pixel; render with NEAREST filtering",
            "anchor_note": "anchor = feet contact point (x, y) in frame px, origin top-left", "sprites": {}}
    if os.path.exists(cfg["meta"]):
        meta = json.load(open(cfg["meta"]))
    os.makedirs(cfg["out_dir"], exist_ok=True); os.makedirs(cfg["review_dir"], exist_ok=True)
    for sh in cfg["sheets"]:
        im = load(sh)
        rb = sh["ref_box"]; scale = (rb[3] - rb[1]) / sh["target_h"]
        ims = {sh["src"]: im}
        def im_for(spec):
            s = spec.get("src", sh["src"])
            if s not in ims: ims[s] = load(dict(sh, src=s))
            return ims[s]
        allc = {a: [crop(im_for(spec), f) for f in spec["frames"]] for a, spec in sh["anims"].items()}
        if sh.get("palette_from"):   # reuse an existing character's exact palette (all colours of its strips)
            cols = set()
            for f in sh["palette_from"]:
                im_ = np.array(Image.open(f).convert("RGBA")); cols |= set(map(tuple, im_[im_[..., 3] > 0][:, :3]))
            pal = np.array(sorted(cols))
        else:
            pal = P.build_palette([c for cs in allc.values() for c in cs], sh.get("palette_n", 22), force=sh.get("force", []))
        for src_c, dst_c in sh.get("remap", []):   # palette-level colour correction (e.g. orange AI skin -> peach)
            d = np.abs(pal.astype(int) - np.array(src_c)).sum(1)
            for i in np.nonzero(d < sh.get("remap_tol", 70))[0]:
                pal[i] = np.clip(pal[i].astype(int) + np.array(dst_c) - np.array(src_c), 0, 255)
        prot = None
        if sh.get("protect"):
            P_ = [np.array(p) for p in sh["protect"]]
            prot = lambda c: any(np.abs(np.array(c, int) - p).sum() < 20 for p in P_)
        review = []
        for a, spec in sh["anims"].items():
            sc = scale if "ref_box" not in spec else (spec["ref_box"][3] - spec["ref_box"][1]) / spec["target_h"]
            sps = [P.pixelize(c, sc, pal, dark_boost=sh.get("dark_boost", 1.5), outline=sh.get("outline", "inner"), protect=prot,
                              cover=sh.get("cover", 0.42), boost=sh.get("boost"),
                              fit_phase=sh.get("fit_phase", False), inner=sh.get("inner", 1.0), min_blob=sh.get("min_blob", 0)) for c in allc[a]]
            W, H = spec.get("frame", sh.get("frame", "auto"))  if spec.get("frame", sh.get("frame")) != "auto" else (None, None)
            if W is None:
                W = max(s.shape[1] for s in sps) + 2; H = max(s.shape[0] for s in sps) + 1
                W += W % 2; H += H % 2
            frames = [place(s, W, H, spec.get("align", sh.get("align", "head"))) for s in sps]
            strip = np.concatenate(frames, 1)
            name = spec.get("name", f"{sh['name']}_{a}")
            Image.fromarray(strip).save(os.path.join(cfg["out_dir"], name + ".png"))
            ncol = len(np.unique(strip[strip[..., 3] > 0][:, :3], axis=0))
            meta["sprites"][name] = {"file": name + ".png", "frame_w": W, "frame_h": H, "frames": len(frames),
                                     "anchor": [W // 2, H - 1], "fps": spec.get("fps", 8), "loop": spec.get("loop", True),
                                     "colors": int(ncol), "source": os.path.relpath(spec.get("src", sh["src"]), cfg["root"])}
            if "note" in spec: meta["sprites"][name]["note"] = spec["note"]
            print(f"{name}: {len(frames)}x {W}x{H}, {ncol} colours, sizes {[s.shape[1::-1] for s in sps]}")
            review.append((a, strip))
        # review sheet at 8x on checker-free mid gray
        z = 8; pad = 4
        Wr = max(s.shape[1] for _, s in review) + 2 * pad; Hr = sum(s.shape[0] + pad for _, s in review) + pad
        rv = Image.new("RGBA", (Wr, Hr), tuple(sh.get("review_bg", [104, 122, 140])) + (255,)); y = pad
        for _, s in review:
            rv.alpha_composite(Image.fromarray(s), (pad, y)); y += s.shape[0] + pad
        rv.resize((Wr * z, Hr * z), Image.NEAREST).convert("RGB").save(os.path.join(cfg["review_dir"], f"{sh['name']}_x8.png"))
    json.dump(meta, open(cfg["meta"], "w"), indent=1)

if __name__ == "__main__":
    cfg = json.load(open(sys.argv[1]))
    build(cfg)
