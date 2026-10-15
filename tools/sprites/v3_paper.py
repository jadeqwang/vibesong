"""v3 paper Jade: v1 drawings + canon fixes. Face/hair from v1 (same picture, same place), costume changes taken from a
nano-banana-pro edit of the SAME v1 image (sub-pixel aligned) only where the edit differs, real artwork composited."""
import sys
import numpy as np, cv2
from PIL import Image
from scipy import ndimage
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/sprites")
V = "/home/jade/Documents/vibesong/"

def arr(p, size=None):
    im = Image.open(p).convert("RGB")
    if size and im.size != size: im = im.resize(size, Image.LANCZOS)
    return np.array(im).astype(np.float32)

def headphone_mask(a, box):
    """Orange rims of the headphone cups in v1 -> filled hull per cup (+ margin)."""
    x0, y0, x1, y1 = box; s = a[y0:y1, x0:x1]
    r, g, b = s[..., 0], s[..., 1], s[..., 2]
    orange = (r > 170) & (g > 70) & (g < 170) & (b < 110) & (r - b > 90)
    lab, n = ndimage.label(ndimage.binary_dilation(orange, iterations=4))
    m = np.zeros(a.shape[:2], bool)
    for k in range(1, n + 1):
        comp = lab == k
        if comp.sum() < 150: continue
        pts = np.argwhere(comp)[:, ::-1].astype(np.int32)
        hull = cv2.convexHull(pts); mm = np.zeros(s.shape[:2], np.uint8); cv2.fillPoly(mm, [hull], 1)
        m[y0:y1, x0:x1] |= ndimage.binary_dilation(mm.astype(bool), iterations=5)
    return m

def diff_composite(v1, ed, regions, keep_masks, thr=16, grow=7, feather=2.5):
    """Take `ed` where it differs from v1 inside `regions` (list of (x0,y0,x1,y1, ycut)), except keep_masks (v1 wins)."""
    d = np.abs(cv2.GaussianBlur(ed, (0, 0), 2.5) - cv2.GaussianBlur(v1, (0, 0), 2.5)).mean(-1)
    take = np.zeros(d.shape, bool)
    for x0, y0, x1, y1, ycut in regions:
        sub = d[y0:y1, x0:x1] > thr
        sub = ndimage.binary_closing(sub, iterations=3); sub = ndimage.binary_dilation(sub, iterations=grow)
        sub[: max(ycut - y0, 0)] = False
        take[y0:y1, x0:x1] |= sub
    for km in keep_masks: take &= ~km
    al = cv2.GaussianBlur(take.astype(np.float32), (0, 0), feather)[..., None]
    return v1 * (1 - al) + ed * al, take

def thicken_brows(a, landmarks_box, amount=0.75):
    """Slightly thicker brows: grow the existing brow strokes by ~1 px (down + up) in their own colour."""
    import mediapipe as mp
    from mediapipe.tasks import python as mpt
    from mediapipe.tasks.python import vision
    det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=mpt.BaseOptions(model_asset_path="/home/jade/Documents/1-music-shipped/moongazing/tools/sync/models/face_landmarker.task")))
    x0, y0, x1, y1 = landmarks_box
    crop = np.ascontiguousarray(a[y0:y1, x0:x1].astype(np.uint8))
    up = 3; big = cv2.resize(crop, None, fx=up, fy=up, interpolation=cv2.INTER_CUBIC)
    r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=big))
    if not r.face_landmarks: print("  no face", landmarks_box); return a, None
    L = np.array([[p.x * big.shape[1] / up + x0, p.y * big.shape[0] / up + y0] for p in r.face_landmarks[0]])
    out = a.copy(); info = []
    for idx in ([70, 63, 105, 66, 107, 55, 65, 52, 53, 46], [300, 293, 334, 296, 336, 285, 295, 282, 283, 276]):
        P = L[idx]; bx0, by0 = np.floor(P.min(0) - [4, 5]).astype(int); bx1, by1 = np.ceil(P.max(0) + [4, 5]).astype(int)
        reg = a[by0:by1, bx0:bx1]; lum = reg.mean(-1)
        stroke = lum < np.percentile(lum, 30)
        stroke = ndimage.binary_opening(stroke, iterations=1) | stroke & (lum < np.percentile(lum, 15))
        lab, n = ndimage.label(stroke)
        if n == 0: continue
        big_c = np.argmax(ndimage.sum(stroke, lab, range(1, n + 1))) + 1; stroke = lab == big_c
        col = reg[stroke].mean(0)
        grown = ndimage.binary_dilation(stroke, structure=np.array([[0, 1, 0], [0, 1, 0], [0, 1, 0]]), iterations=1) & ~stroke
        al = cv2.GaussianBlur(grown.astype(np.float32), (0, 0), 0.6)[..., None] * amount
        out[by0:by1, bx0:bx1] = reg * (1 - al) + col * al
        info.append((int(bx0), int(by0), int(stroke.sum()), int(grown.sum())))
    return out, info
