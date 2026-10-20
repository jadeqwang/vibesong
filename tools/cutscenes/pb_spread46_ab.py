"""v4.6 v46_outro: A/B crop sheet, lanczos 1080 vs upscaled 1080 of the outro spread layer (same 30 fps FrameSeq index k).
    $OSPY tools/cutscenes/pb_spread46_ab.py SEQ_A,SEQ_B[,SEQ_C] OUT.jpg K[,K...] [REGION ...] [--zoom=2]
SEQ_* = media/act5/frames/<name>/1080 (2 or more, side by side, labelled in order). REGION = name:x0,y0,x1,y1 in 1080 px (defaults: jade, charlie, ricky, seam).
Each row = one (frame, region): A | B | ..., nearest-neighbour zoom so pencil grain and sharpening halos are visible."""
import sys, os, numpy as np, cv2
a = [x for x in sys.argv[1:] if not x.startswith('--')]; o = dict(x[2:].split('=', 1) for x in sys.argv[1:] if x.startswith('--'))
S, out, ks = a[0].split(','), a[1], [int(v) for v in a[2].split(',')]
R = {"jade": (870, 100, 1190, 430), "charlie": (520, 190, 760, 410), "ricky": (1290, 200, 1540, 430), "seam": (1060, 380, 1260, 700)}
if len(a) > 3: R = {r.split(':')[0]: tuple(int(v) for v in r.split(':')[1].split(',')) for r in a[3:]}
z = float(o.get('zoom', 2)); rows = []
for k in ks:
    fs = [cv2.imread(f"{d}/f_{k:05d}.jpg") for d in S]
    for n, (x0, y0, x1, y1) in R.items():
        cs = [cv2.resize(f[y0:y1, x0:x1], None, fx=z, fy=z, interpolation=cv2.INTER_NEAREST) for f in fs]
        sep = np.full((cs[0].shape[0], 6, 3), 255, np.uint8); row = cs[0]
        for c in cs[1:]: row = np.hstack([row, sep, c])
        bar = np.full((22, row.shape[1], 3), 0, np.uint8)
        lab = f"k={k} song {186.30 + k / 30:.3f}  {n}  |  " + "  ".join(os.path.basename(os.path.dirname(d)) for d in S)
        cv2.putText(bar, lab, (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        rows.append(np.vstack([bar, row]))
W = max(r.shape[1] for r in rows)
rows = [np.hstack([r, np.zeros((r.shape[0], W - r.shape[1], 3), np.uint8)]) for r in rows]
cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 90]); print(out, len(rows), "rows")
