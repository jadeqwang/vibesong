"""Per-region motion of a living-layer frame sequence (Farneback flow between consecutive 540p frames, p90 magnitude per
region, reported in 1080 px). Used to compare spreadR_v11 vs v12 (Jade's note: heads bob on frozen bodies).
    $OSPY tools/cutscenes/pb_flow_regions.py FRAMES_540_DIR [FRAMES_540_DIR ...] [--csv=OUT.csv]"""
import sys, os, glob, numpy as np, cv2
REG = {   # 960x540 frame px (x0, y0, x1, y1)
    'jade_head': (470, 60, 600, 210), 'jade_torso': (470, 215, 640, 340),
    'charlie_head': (285, 100, 385, 210), 'charlie_hand_guitar': (250, 250, 450, 380),
    'ricky_head': (650, 100, 760, 210), 'ricky_torso_hand': (600, 200, 800, 360),
}
args = [a for a in sys.argv[1:] if not a.startswith('--')]; opt = dict((a[2:].split('=') + [''])[:2] for a in sys.argv[1:] if a.startswith('--'))
rows = []
for d in args:
    fs = sorted(glob.glob(os.path.join(d, 'f_*.jpg'))); prev = None; M = {k: [] for k in REG}
    for f in fs:
        g = cv2.cvtColor(cv2.imread(f), cv2.COLOR_BGR2GRAY)
        if prev is not None:
            fl = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 15, 3, 5, 1.2, 0); mag = np.linalg.norm(fl, axis=-1) * 2   # -> 1080 px
            for k, (x0, y0, x1, y1) in REG.items(): M[k].append(np.percentile(mag[y0:y1, x0:x1], 90))
        prev = g
    name = d.rstrip('/').split('/frames/')[-1]
    for k, v in M.items():
        v = np.array(v); rows.append((name, k, np.median(v), v.min(), (v < 0.3).sum(), (v < 0.8).sum(), len(v)))
print(f"{'seq':22s} {'region':20s} {'median':>7s} {'min':>6s} {'<0.3':>5s} {'<0.8':>5s} {'n':>4s}")
for r in rows: print(f'{r[0]:22s} {r[1]:20s} {r[2]:7.2f} {r[3]:6.2f} {r[4]:5d} {r[5]:5d} {r[6]:4d}')
if opt.get('csv'):
    with open(opt['csv'], 'w') as fh:
        fh.write('seq,region,median,min,lt0.3,lt0.8,n\n'); [fh.write(','.join(str(round(x, 3)) if isinstance(x, float) else str(x) for x in r) + '\n') for r in rows]
