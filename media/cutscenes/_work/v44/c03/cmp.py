import sys, cv2, numpy as np
def frames(p):
    c = cv2.VideoCapture(p); out = []
    while True:
        ok, f = c.read()
        if not ok: break
        out.append(f[120:320, 200:380].astype(np.float32))
    return out
R = frames(sys.argv[1]); A = frames(sys.argv[2]); B = frames(sys.argv[3])
for k in range(90, 135):
    t = 17 + k / 30
    print(f"{t:.3f} vs+0 {np.abs(R[k]-A[k]).mean():5.2f} vs+6 {np.abs(R[k]-B[k]).mean():5.2f}  step {np.abs(R[k]-R[k-1]).mean():5.2f}")
