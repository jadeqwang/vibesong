"""Put the v11 brows onto the bridge singing take, frame by frame (OS venv: mediapipe + cv2).
    $OSPY tools/cutscenes/pb_browtrack.py SRC_FRAMES_DIR REF_IDX EDIT.png OUT_DIR
EDIT = a nano-banana-pro v11-brow edit of frame REF_IDX (drawn by the model). Mask = (dark in ref | dark in edit) inside each brow's
landmark hull (dilated), feathered. For every frame, a per-brow similarity transform (FaceMesh brow + upper-lid landmarks, frame REF ->
frame k, temporally smoothed) moves the edited brow patch onto the frame; outside the mask the frame is untouched."""
import sys, os, glob, numpy as np, cv2, mediapipe as mp
src, ref_i, edit, out = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]; os.makedirs(out, exist_ok=True)
files = sorted(glob.glob(os.path.join(src, 'f*.png'))); F = [cv2.imread(f) for f in files]; H, W = F[0].shape[:2]
E = cv2.resize(cv2.imread(edit), (W, H), interpolation=cv2.INTER_AREA)
BROWS = [[70, 63, 105, 66, 107, 46, 53, 52, 65, 55, 159, 158, 160], [300, 293, 334, 296, 336, 276, 283, 282, 295, 285, 386, 385, 387]]
HULL = [[70, 63, 105, 66, 107, 55, 65, 52, 53, 46], [300, 293, 334, 296, 336, 285, 295, 282, 283, 276]]
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3)
LM = []
for f in F:
    r = fm.process(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    LM.append(None if not r.multi_face_landmarks else np.array([[p.x * W, p.y * H] for p in r.multi_face_landmarks[0].landmark]))
print('faces found', sum(l is not None for l in LM), '/', len(LM))
R = LM[ref_i]
# masks in the ref frame
g0 = cv2.cvtColor(F[ref_i], cv2.COLOR_BGR2GRAY).astype(float); g1 = cv2.cvtColor(E, cv2.COLOR_BGR2GRAY).astype(float)
masks = []
for hull in HULL:
    m = np.zeros((H, W), np.uint8); cv2.fillConvexPoly(m, cv2.convexHull(R[hull].astype(np.int32)), 255)
    m = cv2.dilate(m, np.ones((9, 9), np.uint8))
    dark = ((g0 < 120) | (g1 < 120)).astype(np.uint8) * 255
    mm = cv2.dilate(cv2.bitwise_and(m, dark), np.ones((5, 5), np.uint8))
    mm = cv2.GaussianBlur(mm.astype(float) / 255, (0, 0), 1.6) * (cv2.GaussianBlur(m.astype(float) / 255, (0, 0), 2.0))
    masks.append(np.clip(mm * 1.3, 0, 1))
cv2.imwrite(os.path.join(out, '_mask.png'), (np.maximum(*masks) * 255).astype(np.uint8))
# per-brow similarity ref -> k, smoothed over time
def sim(a, b):
    M, _ = cv2.estimateAffinePartial2D(a.astype(np.float32), b.astype(np.float32), method=cv2.LMEDS); return M
P = []
for k in range(len(F)):
    L = LM[k] if LM[k] is not None else (P and None)
    P.append([sim(R[b], LM[k][b]) if LM[k] is not None else None for b in BROWS])
for bi in range(2):
    seq = np.array([p[bi].ravel() if p[bi] is not None else [np.nan] * 6 for p in P])
    for c in range(6):
        s = seq[:, c]; ok = ~np.isnan(s); s = np.interp(np.arange(len(s)), np.where(ok)[0], s[ok])
        k = np.ones(5) / 5; seq[:, c] = np.convolve(np.pad(s, 2, mode='edge'), k, 'valid')
    for k in range(len(F)): P[k][bi] = seq[k].reshape(2, 3)
drift = []
for k, f in enumerate(F):
    o = f.astype(float)
    for bi in range(2):
        M = P[k][bi]; pe = cv2.warpAffine(E, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT).astype(float)
        mk = cv2.warpAffine(masks[bi], M, (W, H), flags=cv2.INTER_LINEAR)[..., None]
        o = o * (1 - mk) + pe * mk
        drift.append(np.abs(M[:, 2] - [0, 0]).max() if k else 0)
    cv2.imwrite(os.path.join(out, os.path.basename(files[k])), o.clip(0, 255).astype(np.uint8))
print('max brow translation px', max(drift))
