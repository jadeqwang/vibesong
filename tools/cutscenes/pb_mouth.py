"""Pass B: print a take's mouth-open curve (inner-lip gap / face height) per frame, as song time at lag 0, with closures marked.
    $OSPY tools/cutscenes/pb_mouth.py TAKE.mp4 S0 FROM TO [CROP x0,y0,x1,y1]
Use it to read a take's own offset from known closures (m / b / p) when the vocal is too legato for the envelope correlation."""
import sys, numpy as np, cv2, mediapipe as mp
take, s0, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
crop = [float(v) for v in sys.argv[5].split(',')] if len(sys.argv) > 5 else None
cap = cv2.VideoCapture(take); fps = cap.get(cv2.CAP_PROP_FPS)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3)
k = 0
while True:
    ok, f = cap.read()
    if not ok: break
    t = k / fps + s0; k += 1
    if not (a <= t <= b): continue
    if crop: h, w = f.shape[:2]; f = f[int(crop[1] * h):int(crop[3] * h), int(crop[0] * w):int(crop[2] * w)]
    h, w = f.shape[:2]; r = fm.process(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks: print(f'{t:7.3f}  ?'); continue
    L = r.multi_face_landmarks[0].landmark; P = lambda i: np.array([L[i].x * w, L[i].y * h])
    g = np.linalg.norm(P(13) - P(14)) / np.linalg.norm(P(10) - P(152))
    print(f'{t:7.3f} {g:5.3f} ' + '#' * int(g * 300) + ('   <closed' if g < 0.012 else ''))
