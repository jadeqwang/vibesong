"""v4.4 card 05: how much do Charlie (image-left) and Ricky (image-right) move? Mean Farneback flow magnitude (px/frame, 480p take scale)
in each player's box, and the COHERENT (mean-vector) part, frames from A to B s.   $OSPY tools/cutscenes/pb_bandmotion.py TAKE.mp4 [A B]"""
import sys, numpy as np, cv2
cap = cv2.VideoCapture(sys.argv[1]); fps = cap.get(cv2.CAP_PROP_FPS); A = float(sys.argv[2]) if len(sys.argv) > 2 else .3; B = float(sys.argv[3]) if len(sys.argv) > 3 else 3.6
BOX = {"charlie": (0.08, 0.18, 0.33, 0.92), "ricky": (0.73, 0.18, 0.95, 0.92), "jade_body": (0.38, 0.5, 0.66, 1.0)}
prev = None; k = -1; acc = {n: [] for n in BOX}
while True:
    ok, f = cap.read(); k += 1
    if not ok: break
    if not (A <= k / fps <= B): continue
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
    if prev is not None:
        fl = cv2.calcOpticalFlowFarneback(prev, g, None, .5, 3, 15, 3, 5, 1.2, 0); h, w = g.shape
        for n, (x0, y0, x1, y1) in BOX.items():
            r = fl[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)]; acc[n].append((np.linalg.norm(r, axis=2).mean(), np.linalg.norm(r.reshape(-1, 2).mean(0))))
    prev = g
print(sys.argv[1].split('/')[-1], " ".join(f"{n}: mag {np.mean([a for a, _ in v]):.2f} coh {np.mean([c for _, c in v]):.2f}" for n, v in acc.items()))
