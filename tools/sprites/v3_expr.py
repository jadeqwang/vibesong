import sys; sys.path.insert(0, "/home/jade/Documents/vibesong/tools/sprites")
import numpy as np
from PIL import Image
from v3_paper import *
import v3_pencils as VP
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=mpt.BaseOptions(
    model_asset_path="/home/jade/Documents/1-music-shipped/moongazing/tools/sync/models/face_landmarker.task")))
v1 = arr(V + "assets/sheets/raw/paper_expr_jade_t2.png"); ed = arr(V + "assets/sheets/raw/v3_expr_nbp_a.png", (2752, 1536))
regions, keep, faces = [], [], []
for row in range(2):
    for col in range(3):
        x0, y0 = col * 917, row * 768; x1, y1 = x0 + 917, y0 + 768
        crop = np.ascontiguousarray(v1[y0:y1, x0:x1].astype(np.uint8))
        r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=crop))
        L = np.array([[p.x * 917 + x0, p.y * 768 + y0] for p in r.face_landmarks[0]])
        chin = int(L[152, 1]); regions.append((x0, y0, x1, y1, chin + 12))
        keep.append(headphone_mask(v1, (x0, chin - 40, x1, min(y1, chin + 260))))
        fx0, fy0 = L.min(0).astype(int) - 40; fx1, fy1 = L.max(0).astype(int) + 40
        faces.append((max(fx0, x0), max(fy0, y0), min(fx1, x1), min(fy1, y1)))
out, take = diff_composite(v1, ed, regions, keep, thr=10)
for fb in faces:
    out, info = thicken_brows(out, fb, amount=0.95); print("brows", info)
for near in [(1630, 350), (2492, 306), (805, 1110), (1665, 1125), (2540, 1122)]:
    print("rainbow", VP.paint_rainbow_point(out, near, (0.6, 0.8)))
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(V + "assets/sheets/paper/paper_expr_jade.png")
