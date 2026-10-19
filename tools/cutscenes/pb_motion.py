"""v4.3: how much does the singer move? (OS venv: cv2 + mediapipe)
    $OSPY tools/cutscenes/pb_motion.py CLIP.mp4 [FROM_S TO_S]
Per clip: head translation (face-centre path, % of face height: range and mean speed), head roll / yaw-proxy range (deg / %),
eye-line shifts (iris offset range, % of eye width), and body motion = mean Farneback flow magnitude (px/frame at 1080p scale)
in a torso band below the chin (mouth excluded). A frozen body with a moving mouth scores ~0 on everything except the mouth."""
import sys, numpy as np, cv2, mediapipe as mp
clip = sys.argv[1]; A = float(sys.argv[2]) if len(sys.argv) > 2 else 0; B = float(sys.argv[3]) if len(sys.argv) > 3 else 1e9
cap = cv2.VideoCapture(clip); fps = cap.get(cv2.CAP_PROP_FPS)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3)
C, R, Y, E, FL, HF, HV, BV = [], [], [], [], [], [], [], []; prev = None; k = -1
while True:
    ok, f = cap.read(); k += 1
    if not ok: break
    t = k / fps
    if t < A or t > B: continue
    h, w = f.shape[:2]; s = 1080 / h
    r = fm.process(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    g = cv2.cvtColor(cv2.resize(f, (480, 270)), cv2.COLOR_BGR2GRAY)
    if not r.multi_face_landmarks: prev = g; continue
    L = r.multi_face_landmarks[0].landmark; P = lambda i: np.array([L[i].x * w, L[i].y * h])
    fh = np.linalg.norm(P(10) - P(152)); c = (P(10) + P(152)) / 2
    C.append(c / fh * 100); R.append(np.degrees(np.arctan2(*(P(263) - P(33))[::-1])))
    Y.append((P(1)[0] - (P(234)[0] + P(454)[0]) / 2) / np.linalg.norm(P(234) - P(454)) * 100)
    E.append(((P(468)[0] - P(33)[0]) / (P(133)[0] - P(33)[0])) * 100)
    if prev is not None:
        fl = cv2.calcOpticalFlowFarneback(prev, g, None, .5, 3, 15, 3, 5, 1.2, 0)
        cx, cy = c * 480 / w; fhs = fh * 270 / h
        y0, y1 = int(min(269, cy + .75 * fhs)), int(min(270, cy + 1.9 * fhs)); x0, x1 = int(max(0, cx - 1.3 * fhs)), int(min(480, cx + 1.3 * fhs))
        if y1 > y0 + 4: FL.append(np.linalg.norm(fl[y0:y1, x0:x1], axis=2).mean() * (w / 480) * s)
        hy0, hy1 = int(max(0, cy - .75 * fhs)), int(max(1, cy - .1 * fhs)); hx0, hx1 = int(max(0, cx - .6 * fhs)), int(min(480, cx + .6 * fhs))
        HF.append(np.linalg.norm(fl[hy0:hy1, hx0:hx1], axis=2).mean() * (w / 480) * s)
        HV.append(fl[hy0:hy1, hx0:hx1].reshape(-1, 2).mean(0) * (w / 480) * s)
        if y1 > y0 + 4: BV.append(fl[y0:y1, x0:x1].reshape(-1, 2).mean(0) * (w / 480) * s)
    prev = g
C = np.array(C); C = np.stack([np.convolve(np.pad(C[:, i], 3, mode='edge'), np.ones(7) / 7, 'valid') for i in range(2)], 1); sp = np.linalg.norm(np.diff(C, axis=0), axis=1).mean() * fps if len(C) > 1 else 0
rng = lambda v: np.ptp(np.array(v)) if len(v) else 0
def coh(V):
    if not V: return 0, 0
    V = np.array(V); P = np.cumsum(V, 0); return np.linalg.norm(V, axis=1).mean() * fps, max(np.ptp(P[:, 0]), np.ptp(P[:, 1]))
hs, hr = coh(HV); bs, br = coh(BV)
print(f"{clip.split('/')[-1]:44s} COHERENT (1080p px): head {hs:5.1f} px/s, path range {hr:5.1f} px | torso {bs:5.1f} px/s, range {br:5.1f} px")
print(f"{clip.split('/')[-1]:44s} n={len(C):3d} head range x{rng(C[:,0]):5.1f} y{rng(C[:,1]):5.1f} %fh  speed {sp:5.1f} %fh/s  roll {rng(R):4.1f} deg  yaw {rng(Y):4.1f} %  eyes {rng(E):4.1f} %  head flow {np.mean(HF) if HF else 0:5.2f}  body flow {np.mean(FL) if FL else 0:5.2f} px/fr")
