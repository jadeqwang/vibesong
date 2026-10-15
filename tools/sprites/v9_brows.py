"""v9: model-drawn brows (nano-banana-pro edit of the v3 sheet), composited back ONLY inside a feathered forehead/brow band
per face (v3 pixels everywhere else). Usage: v9_brows.py  -> writes v6/<sheet>_v9<cand>.png for every candidate + checks;
v9_brows.py pick turn=a,b expr=a,c,b,... lineup=a -> final v6/<sheet>_v9.png from per-face choices."""
import sys, json, numpy as np, cv2
from PIL import Image
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/sprites")
import v5_brows as B5, v6_brows as S6
V = "/home/jade/Documents/vibesong/assets/sheets/"
SHEETS = {"turn": ("paper/old_v3/paper_jade_turnaround.png", [(250, 140, 520, 420), (880, 140, 1160, 420)]),
          "expr": ("paper/old_v3/paper_expr_jade.png", [(c * 917, r * 768, c * 917 + 917, r * 768 + 768) for r in range(2) for c in range(3)]),
          "lineup": ("paper/old_v3/paper_lineup.png", [(450, 150, 700, 400)])}
CANDS = "abc"

def cand_path(nm, k):
    for ext in ("png", "jpg"):
        p = V + f"raw/v9_{nm}_{k}.{ext}"
        try: open(p).close(); return p
        except OSError: pass

def band_mask(shape, Lm):
    m = np.zeros(shape, np.uint8)
    for s in ("R", "L"):
        S = S6.SIDE[s]; P = Lm[S["brow"]]; ew = np.linalg.norm(Lm[S["inner"]] - Lm[S["outer"]])
        x0, x1 = P[:, 0].min() - 0.35 * ew, P[:, 0].max() + 0.35 * ew
        lid = Lm[S["lid"]][1]; bottom = lid - 0.14 * ew; top = P[:, 1].min() - 0.75 * ew
        cv2.rectangle(m, (int(x0), int(top)), (int(x1), int(bottom)), 1, -1)
    m = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 4)
    return m

def run():
    report = {}
    for nm, (src, faces) in SHEETS.items():
        v3 = np.array(Image.open(V + src).convert("RGB")).astype(np.float32)
        lms = [B5.landmarks(v3, b) for b in faces]
        for k in CANDS:
            ed = np.array(Image.open(cand_path(nm, k)).convert("RGB").resize((v3.shape[1], v3.shape[0]), Image.LANCZOS)).astype(np.float32)
            out = v3.copy()
            for i, (box, Lm) in enumerate(zip(faces, lms)):
                M = band_mask(v3.shape[:2], Lm)
                # checks: shift of the face, and change of the eyes (just below the band)
                x0, y0, x1, y1 = box
                A, Bm = v3[y0:y1, x0:x1].mean(-1), ed[y0:y1, x0:x1].mean(-1)
                (dx, dy), _ = cv2.phaseCorrelate(A.astype(np.float32), Bm.astype(np.float32))
                eye = np.zeros(v3.shape[:2], bool)
                for s in ("R", "L"):
                    S = S6.SIDE[s]; P = Lm[[S["inner"], S["outer"], S["lid"], 145 if s == "R" else 374]]
                    ex0, ey0 = P.min(0).astype(int) - 3; ex1, ey1 = P.max(0).astype(int) + 3; eye[ey0:ey1, ex0:ex1] = True
                eyediff = float(np.abs(v3[eye] - ed[eye]).mean())
                report[f"{nm}{i}_{k}"] = dict(shift=[round(dx, 2), round(dy, 2)], eye_diff=round(eyediff, 1))
                Mf = M[..., None]
                out = out * (1 - Mf) + ed * Mf
            Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(V + f"v6/{nm}_v9{k}.png")
    json.dump(report, open(V + "v6/v9_checks.json", "w"), indent=1); print(json.dumps(report))

def pick(choice):
    for nm, (src, faces) in SHEETS.items():
        v3 = np.array(Image.open(V + src).convert("RGB")).astype(np.float32); out = v3.copy()
        ks = choice[nm]
        for i, box in enumerate(faces):
            Lm = B5.landmarks(v3, box); M = band_mask(v3.shape[:2], Lm)[..., None]
            ed = np.array(Image.open(cand_path(nm, ks[i])).convert("RGB").resize((v3.shape[1], v3.shape[0]), Image.LANCZOS)).astype(np.float32)
            out = out * (1 - M) + ed * M
        Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(V + f"v6/{nm}_v9.png")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "pick":
        pick({a.split("=")[0]: a.split("=")[1].split(",") for a in sys.argv[2:]})
    else:
        run()
