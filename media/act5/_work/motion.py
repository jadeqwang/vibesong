"""motion.py CLIP : per 0.5 s, homography of frame vs frame 0: translation (px), scale, perspective terms (tilt), inliers"""
import sys, cv2, numpy as np
cap = cv2.VideoCapture(sys.argv[1]); fr = []
while True:
    ok, f = cap.read()
    if not ok: break
    fr.append(cv2.cvtColor(cv2.resize(f, (960, 540)), cv2.COLOR_BGR2GRAY))
orb = cv2.ORB_create(5000); bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
prev = 0; Hacc = np.eye(3)
for i in range(12, len(fr), 12):
    ka, da = orb.detectAndCompute(fr[prev], None); kb, db = orb.detectAndCompute(fr[i], None)
    m = bf.match(da, db); pa = np.float32([ka[x.queryIdx].pt for x in m]); pb = np.float32([kb[x.trainIdx].pt for x in m])
    H, inl = cv2.findHomography(pa, pb, cv2.RANSAC, 2.0); Hacc = H @ Hacc; prev = i
    c = cv2.perspectiveTransform(np.float32([[[480, 270]], [[0, 0]], [[960, 540]]]), Hacc).reshape(-1, 2)
    sc = np.linalg.norm(c[2] - c[1]) / np.linalg.norm([960, 540])
    print(f"t={i/24:.2f}s  centre->({c[0][0]:.0f},{c[0][1]:.0f})  scale {sc:.3f}  persp ({Hacc[2,0]*1e4:.2f},{Hacc[2,1]*1e4:.2f})e-4  inl {inl.sum()}/{len(m)}")
