"""track_sweep.py: per-frame homography of the sweep clip relative to the resolve2 LAST frame (= engine-registered aerial).
Writes frames/sweep/track.json {H: [[9 floats] per frame]} mapping reference uv (0..1, y down) -> sweep frame uv.
Chained frame-to-frame + re-anchored to the reference every frame (ORB, RANSAC)."""
import json, sys, cv2, numpy as np
R = 'frames'; N = int(sys.argv[1]) if len(sys.argv) > 1 else 178
ref = cv2.imread(f'{R}/resolve2/1080/f_00096.jpg', 0)
h, w = ref.shape
orb = cv2.ORB_create(8000)
def H_of(a, b):  # homography mapping a-pixels -> b-pixels
    ka, da = orb.detectAndCompute(a, None); kb, db = orb.detectAndCompute(b, None)
    m = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(da, db)
    pa = np.float32([ka[x.queryIdx].pt for x in m]); pb = np.float32([kb[x.trainIdx].pt for x in m])
    H, inl = cv2.findHomography(pa, pb, cv2.RANSAC, 2.0)
    return H, int(inl.sum()), len(m)
S = np.diag([w, h, 1.0]); Si = np.linalg.inv(S)
out = []
for i in range(N):
    f = cv2.imread(f'{R}/sweep/1080/f_{i:05d}.jpg', 0)
    H, ni, nm = H_of(ref, f)
    Hn = Si @ H @ S; Hn /= Hn[2, 2]
    p = Hn @ np.array([0.155, 0.505, 1.0]); p = p[:2] / p[2]
    print(i, ni, nm, 'yi->', np.round(p, 4)); sys.stdout.flush()
    out.append([float(x) for x in Hn.reshape(-1)])
json.dump({'ref': 'resolve2/f_00096', 'H': out}, open(f'{R}/sweep/track.json', 'w'))
