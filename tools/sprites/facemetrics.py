"""Likeness metrics for drawn Jade faces (run with the orbital-sunrise venv: mediapipe 0.10.14).
facemetrics.py IMG[:x0,y0,x1,y1] ...   -> eye size, forehead height (to the real hairline), face taper, brow asymmetry.
All ratios are scale-free: divided by the face width (cheek 234-454) or the brow-chin length."""
import sys, json
import numpy as np
from PIL import Image
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
MODEL = "/home/jade/Documents/1-music-shipped/moongazing/tools/sync/models/face_landmarker.task"
det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=mpt.BaseOptions(model_asset_path=MODEL), num_faces=1))

def metrics(path, box=None, up=1):
    im = Image.open(path).convert("RGB")
    if box: im = im.crop(box)
    if up != 1: im = im.resize((im.width * up, im.height * up), Image.LANCZOS)
    a = np.array(im)
    r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=a))
    if not r.face_landmarks: return None
    L = np.array([[p.x * im.width, p.y * im.height] for p in r.face_landmarks[0]])
    d = lambda i, j: float(np.linalg.norm(L[i] - L[j]))
    face_w = d(234, 454)
    eye_w = (d(33, 133) + d(362, 263)) / 2
    eye_h = (d(159, 145) + d(386, 374)) / 2
    brow_y = (L[105, 1] + L[334, 1]) / 2
    chin_y = L[152, 1]
    # hairline: walk up from the forehead-top landmark until we hit dark hair
    g = np.array(im.convert("L")).astype(float)
    x = int(L[10, 0]); y = int(L[10, 1]); hair_y = None
    skin = np.median(g[int(L[10, 1]):int(L[9, 1]) + 1, x - 4:x + 5])     # forehead tone just below landmark 10
    for yy in range(y, 0, -1):
        strip = g[max(yy - 4, 0):yy, max(x - 10, 0):x + 10]
        if strip.size and strip.mean() < skin - 45: hair_y = yy; break
    forehead = (brow_y - hair_y) / (chin_y - brow_y) if hair_y else None
    jaw_w = d(172, 397)
    brow_l = L[[70, 63, 105, 66, 107], 1] - L[33, 1]; brow_r = L[[300, 293, 334, 296, 336], 1] - L[263, 1]
    return dict(eye_w_over_face=round(eye_w / face_w, 3), eye_open=round(eye_h / eye_w, 3),
                forehead_over_browchin=round(forehead, 3) if forehead else None,
                jaw_over_cheek=round(jaw_w / face_w, 3), face_len_over_w=round((chin_y - (hair_y or L[10, 1])) / face_w, 3),
                brow_asym=round(float(np.abs(brow_l - brow_r).mean() / face_w), 4))

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        p, _, b = arg.partition(":")
        box = tuple(int(v) for v in b.split(",")) if b else None
        print(arg.split("/")[-1], json.dumps(metrics(p, box, up=2 if box and (box[2] - box[0]) < 400 else 1)))
