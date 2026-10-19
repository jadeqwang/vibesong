"""Lock a conformed living-layer take back onto the still it is registered to (spread.js rect), frame by frame.
Veo sometimes pushes in late in the shot (v12 t1: +5.9 %, t2: +1.1 % over the last second). The page margins / gutter / blank paper
(never the clouds or the characters) are matched to the still with ECC (affine, 540p), the warps are smoothed over time, and each
1080 frame is warped back; any border that the warp exposes is filled from the still (it is blank page there).
    $OSPY tools/cutscenes/pb_stabilize.py SRC_NAME OUT_NAME [--still=media/act5/stills/spread_right_crop_v11.jpg]
Reads media/act5/frames/SRC_NAME/1080, writes media/act5/frames/OUT_NAME/{1080,540} + index.json, prints the per-frame drift."""
import sys, os, glob, json, numpy as np, cv2
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); J = lambda *p: os.path.join(ROOT, *p)
args = [a for a in sys.argv[1:] if not a.startswith('--')]; opt = dict((a[2:].split('=') + [''])[:2] for a in sys.argv[1:] if a.startswith('--'))
src, outn = args
still = cv2.imread(J(opt.get('still', 'media/act5/stills/spread_right_crop_v11.jpg'))); still = cv2.resize(still, (1920, 1080), interpolation=cv2.INTER_AREA)
st = cv2.cvtColor(cv2.resize(still, (960, 540), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
mask = np.zeros((540, 960), np.uint8); mask[485:, :] = 1; mask[:, :110] = 1; mask[:, 880:] = 1        # margins, gutter, paper below the bench
files = sorted(glob.glob(J('media/act5/frames', src, '1080', 'f_*.jpg'))); N = len(files)
Ws = []; W = np.eye(2, 3, dtype=np.float32)
for f in files:
    g = cv2.cvtColor(cv2.resize(cv2.imread(f), (960, 540), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
    try: _, W = cv2.findTransformECC(st, g, W.copy(), cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), mask, 5)
    except cv2.error: pass                                                     # keep the previous warp
    Ws.append(W.copy())
Ws = np.array(Ws).reshape(N, 6)
ker = {'1': [1.0], '3': [1, 2, 1], '5': [1, 2, 3, 2, 1]}[opt.get('smooth', '3')]; ker = np.array(ker, float) / sum(ker); pd = len(ker) // 2   # --smooth=1|3|5 taps
Wsm = np.stack([np.convolve(np.pad(Ws[:, c], pd, mode='edge'), ker, 'valid') for c in range(6)], 1)
od = {h: J('media/act5/frames', outn, str(h)) for h in (1080, 540)}
for d in od.values(): os.makedirs(d, exist_ok=True)
drift = []
for k, f in enumerate(files):
    W = Wsm[k].reshape(2, 3).astype(np.float32).copy(); W[:, 2] *= 2                    # 540 -> 1080 translation
    im = cv2.imread(f)
    out = cv2.warpAffine(im, W, (1920, 1080), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_CONSTANT)
    valid = cv2.warpAffine(np.ones((1080, 1920), np.float32), W, (1920, 1080), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_CONSTANT)
    valid = cv2.GaussianBlur(cv2.erode(valid, np.ones((5, 5), np.uint8)), (0, 0), 2.0)[..., None]
    out = (out * valid + still * (1 - valid)).clip(0, 255).astype(np.uint8)
    cv2.imwrite(os.path.join(od[1080], os.path.basename(f)), out, [cv2.IMWRITE_JPEG_QUALITY, 95])
    cv2.imwrite(os.path.join(od[540], os.path.basename(f)), cv2.resize(out, (960, 540), interpolation=cv2.INTER_LANCZOS4), [cv2.IMWRITE_JPEG_QUALITY, 92])
    s = np.sqrt(abs(np.linalg.det(W[:, :2]))); drift.append((k, s, W[0, 2], W[1, 2]))
idx = json.load(open(J('media/act5/frames', src, '1080', 'index.json')))
for h in (1080, 540): json.dump({'n': N, 'fps': idx.get('fps', 30), 'src': idx.get('src', '') + ' + stabilized to the still (pb_stabilize.py)'}, open(os.path.join(od[h], 'index.json'), 'w'))
for k, s, tx, ty in drift[::20] + [drift[-1]]: print(f'f{k:3d} scale {s:.4f} t ({tx:+.1f}, {ty:+.1f}) px1080')
print('wrote', od)
