"""Per-frame inner-lip gap / face height (MediaPipe) for a silent reaction clip; prints the best 'mouth closed' window."""
import sys, cv2, numpy as np, mediapipe as mp, json
clip, win = sys.argv[1], float(sys.argv[2]); skip = float(sys.argv[3]) if len(sys.argv) > 3 else 0.8
cap = cv2.VideoCapture(clip); fps = cap.get(cv2.CAP_PROP_FPS)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, refine_landmarks=True, min_detection_confidence=.3)
g = []
while True:
    ok, f = cap.read()
    if not ok: break
    h, w = f.shape[:2]; r = fm.process(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks: g.append(np.nan); continue
    L = r.multi_face_landmarks[0].landmark; P = lambda i: np.array([L[i].x * w, L[i].y * h])
    g.append(np.linalg.norm(P(13) - P(14)) / np.linalg.norm(P(10) - P(152)))
g = np.array(g); n = round(win * fps); s0 = round(skip * fps)
best = min(((np.nanmax(g[i:i + n]), np.nanmean(g[i:i + n]), i / fps) for i in range(s0, len(g) - n + 1)))
print(json.dumps({"clip": clip, "frames": len(g), "gap_per_0.25s": [round(float(np.nanmax(g[i:i + 6])), 3) for i in range(0, len(g), 6)],
                  "best_window_start_s": round(best[2], 3), "max_gap": round(float(best[0]), 3), "mean_gap": round(float(best[1]), 3)}))
