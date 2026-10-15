"""Side-by-side face crops: v9 sheet panel | frames of takes at given clip times (MediaPipe-centred crops)."""
import sys, cv2, numpy as np, mediapipe as mp
from PIL import Image, ImageDraw
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, refine_landmarks=True, min_detection_confidence=.3)
def crop(img_bgr, label):
    h, w = img_bgr.shape[:2]; r = fm.process(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
    im = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
    if r.multi_face_landmarks:
        L = r.multi_face_landmarks[0].landmark; P = lambda i: np.array([L[i].x * w, L[i].y * h])
        c = (P(10) + P(152)) / 2; s = np.linalg.norm(P(10) - P(152)) * 0.95
        im = im.crop((int(c[0] - s), int(c[1] - s * 1.1), int(c[0] + s), int(c[1] + s * 0.9)))
    im = im.resize((360, 360), Image.LANCZOS); d = ImageDraw.Draw(im); d.rectangle((0, 0, 360, 18), fill=(0, 0, 0)); d.text((4, 3), label, fill=(255, 255, 0))
    return im
out = sys.argv[1]; tiles = [crop(cv2.imread(sys.argv[2]), "v9 sheet")]
for spec in sys.argv[3:]:
    f, t = spec.rsplit("@", 1); cap = cv2.VideoCapture(f); cap.set(cv2.CAP_PROP_POS_MSEC, float(t) * 1000); ok, fr = cap.read()
    tiles.append(crop(fr, f.split("/")[-1][:24] + f" @{t}s"))
S = Image.new("RGB", (360 * len(tiles), 360)); [S.paste(t, (i * 360, 0)) for i, t in enumerate(tiles)]; S.save(out, quality=92); print(out)
