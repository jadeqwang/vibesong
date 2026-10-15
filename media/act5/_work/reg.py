"""reg.py A B : ORB homography from B to A, print scale/shift and inlier ratio"""
import sys, cv2, numpy as np
a = cv2.imread(sys.argv[1], 0); b = cv2.imread(sys.argv[2], 0)
b = cv2.resize(b, (a.shape[1], a.shape[0]))
orb = cv2.ORB_create(6000); ka, da = orb.detectAndCompute(a, None); kb, db = orb.detectAndCompute(b, None)
m = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(da, db)
pa = np.float32([ka[x.queryIdx].pt for x in m]); pb = np.float32([kb[x.trainIdx].pt for x in m])
H, inl = cv2.findHomography(pb, pa, cv2.RANSAC, 3.0)
c = np.float32([[960, 540], [0, 0], [1920, 1080]]).reshape(-1, 1, 2) * a.shape[1] / 1920
w = cv2.perspectiveTransform(c, H).reshape(-1, 2)
sc = np.linalg.norm(w[2] - w[1]) / np.linalg.norm(c[2] - c[1])
print(f"inliers {inl.sum()}/{len(m)}  centre shift {w[0] - c[0][0]}  scale {sc:.4f}")
