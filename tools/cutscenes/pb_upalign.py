"""v4.3: frame alignment of a flux-video-upscale output vs its input segment, by mouth-curve correlation (the upscaler may add frames).
    $OSPY tools/cutscenes/pb_upalign.py SEG.mp4 UP.mp4 [CROP]  -> corr per frame shift (up frame j = seg frame i + shift)"""
import sys, numpy as np, cv2, mediapipe as mp
crop = [float(v) for v in sys.argv[3].split(',')] if len(sys.argv) > 3 else None
def curve(f):
    fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3)
    c = cv2.VideoCapture(f); g = []
    while True:
        ok, x = c.read()
        if not ok: break
        if crop: h, w = x.shape[:2]; x = x[int(crop[1] * h):int(crop[3] * h), int(crop[0] * w):int(crop[2] * w)]
        h, w = x.shape[:2]; r = fm.process(cv2.cvtColor(x, cv2.COLOR_BGR2RGB))
        if not r.multi_face_landmarks: g.append(np.nan); continue
        L = r.multi_face_landmarks[0].landmark; P = lambda i: np.array([L[i].x * w, L[i].y * h])
        g.append(np.linalg.norm(P(13) - P(14)) / np.linalg.norm(P(10) - P(152)))
    return np.array(g)
a, b = curve(sys.argv[1]), curve(sys.argv[2]); print(len(a), len(b))
for s in range(-2, 4):
    i = np.arange(max(0, -s), min(len(a), len(b) - s)); x, y = a[i], b[i + s]; m = ~np.isnan(x) & ~np.isnan(y)
    print(f"shift {s:+d}: corr {np.corrcoef(x[m], y[m])[0, 1]:.3f}")
