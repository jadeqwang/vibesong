"""v4: brows only. Paste the nano-banana-pro edit (same image, sub-pixel aligned) back onto v3 inside a brow mask
(MediaPipe brow landmarks of v3 AND of the edit, grown a little); everything else stays v3."""
import sys, numpy as np, cv2
from PIL import Image
from scipy import ndimage
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
V = "/home/jade/Documents/vibesong/assets/sheets/"
det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=mpt.BaseOptions(
    model_asset_path="/home/jade/Documents/1-music-shipped/moongazing/tools/sync/models/face_landmarker.task")))
LB = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46]; RB = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276]
def lm(a, box, up=3):
    x0, y0, x1, y1 = box; c = np.ascontiguousarray(a[y0:y1, x0:x1].astype(np.uint8))
    big = cv2.resize(c, None, fx=up, fy=up, interpolation=cv2.INTER_CUBIC)
    r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=big))
    if not r.face_landmarks: return None
    return np.array([[p.x * big.shape[1] / up + x0, p.y * big.shape[0] / up + y0] for p in r.face_landmarks[0]])
def brow_mask(shape, L, grow):
    m = np.zeros(shape, np.uint8)
    for idx in (LB, RB):
        hull = cv2.convexHull(L[idx].astype(np.float32)).astype(np.int32); cv2.fillPoly(m, [hull], 1)
    return ndimage.binary_dilation(m.astype(bool), iterations=grow)
def run(v3p, edp, outp, boxes, grow_frac=0.35, manual=()):
    v3 = np.array(Image.open(v3p).convert("RGB")).astype(np.float32)
    ed = np.array(Image.open(edp).convert("RGB").resize((v3.shape[1], v3.shape[0]), Image.LANCZOS)).astype(np.float32)
    M = np.zeros(v3.shape[:2], bool)
    for box in boxes:
        L3, Le = lm(v3, box), lm(ed, box)
        if L3 is None and Le is None: print("  no face", box); continue
        for L in (L3, Le):
            if L is None: continue
            bh = np.ptp(L[LB][:, 1]) + 1; grow = int(max(3, bh * grow_frac + 3))
            M |= brow_mask(M.shape, L, grow)
        print("  brows", box, "mask px", int(M.sum()))
    for (x0, y0, x1, y1) in manual: M[y0:y1, x0:x1] = True
    al = cv2.GaussianBlur(M.astype(np.float32), (0, 0), 1.6)[..., None]
    out = v3 * (1 - al) + ed * al
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(outp)
    return M
def main_v5():
    run(V + "paper/old_v4/paper_jade_turnaround.png", V + "raw/v5_turn_nbp.png", V + "raw/v5_turn.png",
        [(250, 140, 520, 420), (880, 140, 1160, 420)], manual=[(1586, 209, 1619, 229)])
    boxes = [(c * 917, r * 768, c * 917 + 917, r * 768 + 768) for r in range(2) for c in range(3)]
    run(V + "paper/old_v4/paper_expr_jade.png", V + "raw/v5_expr_nbp.png", V + "raw/v5_expr.png", boxes)
    run(V + "paper/old_v4/paper_lineup.png", V + "raw/v5_lineup_nbp.png", V + "raw/v5_lineup.png", [(450, 150, 700, 400)])
if __name__ == "__main__" and len(sys.argv) > 1 and sys.argv[1] == "v5":
    main_v5(); sys.exit()
if __name__ == "__main__":
    run(V + "paper/paper_jade_turnaround.png", V + "raw/v4_turn_nbp.png", V + "raw/v4_turn.png",
        [(250, 140, 520, 420), (880, 140, 1160, 420)], manual=[(1586, 211, 1619, 229)])
    boxes = [(c * 917, r * 768, c * 917 + 917, r * 768 + 768) for r in range(2) for c in range(3)]
    run(V + "paper/paper_expr_jade.png", V + "raw/v4_expr_nbp.png", V + "raw/v4_expr.png", boxes)
    run(V + "paper/paper_lineup.png", V + "raw/v4_lineup_nbp.png", V + "raw/v4_lineup.png", [(450, 150, 700, 400)])
