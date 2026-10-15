"""Check an edit against its v1 source: per-region shift (phase correlation) and similarity of the head area."""
import sys
import numpy as np, cv2
from PIL import Image
def load(p, size=None):
    im = Image.open(p).convert("L")
    if size and im.size != size: im = im.resize(size, Image.LANCZOS)
    return np.array(im).astype(np.float32)
def check(src, edit, boxes):
    a = load(src); b = load(edit, (a.shape[1], a.shape[0]))
    out = []
    for x0, y0, x1, y1 in boxes:
        A, B = a[y0:y1, x0:x1], b[y0:y1, x0:x1]
        win = cv2.createHanningWindow(A.shape[::-1], cv2.CV_32F)
        (dx, dy), r = cv2.phaseCorrelate(A, B, win)
        diff = np.abs(A - B).mean()
        out.append((round(dx, 2), round(dy, 2), round(r, 2), round(float(diff), 1)))
    return out
if __name__ == "__main__":
    src, edit = sys.argv[1], sys.argv[2]
    boxes = [tuple(map(int, b.split(","))) for b in sys.argv[3:]]
    for b, r in zip(boxes, check(src, edit, boxes)): print(b, "dx,dy,resp,meandiff", r)
