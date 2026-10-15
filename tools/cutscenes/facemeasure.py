"""MediaPipe head-scale check for stills: eye distance, face height (10-152), face width (234-454), nose position."""
import sys, cv2, numpy as np, mediapipe as mp
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, refine_landmarks=True, min_detection_confidence=.3)
base = None
for f in sys.argv[1:]:
    im = cv2.imread(f); h, w = im.shape[:2]; r = fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks: print(f, "no face"); continue
    L = r.multi_face_landmarks[0].landmark; P = lambda i: np.array([L[i].x * w, L[i].y * h])
    m = dict(eye=np.linalg.norm(P(33) - P(263)), fh=np.linalg.norm(P(10) - P(152)), fw=np.linalg.norm(P(234) - P(454)),
             mouthw=np.linalg.norm(P(61) - P(291)))
    nose = P(1)
    if base is None: base = m
    print(f"{f.split('/')[-1]:28s}", " ".join(f"{k} {v:6.1f} ({v / base[k]:.3f})" for k, v in m.items()), f"nose ({nose[0]:.0f},{nose[1]:.0f})")
