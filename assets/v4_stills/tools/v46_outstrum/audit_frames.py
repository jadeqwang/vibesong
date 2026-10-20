#!/usr/bin/env python3
"""v46_outstrum canon/quality audit: Charlie's region cropped from the rendered clip at given song times (camera push undone only
for the crop box; pixels are the clip's own), upscaled to a fixed height, one row per clip.
usage: OSPY tools/v46_outstrum/audit_frames.py OUT.png CLIP_T0 "t1,t2,..." [box sx0,sy0,sx1,sy1] CLIP.mp4 [CLIP2.mp4 ...]"""
import sys, subprocess, numpy as np, cv2
FF = '/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
out, T0, ts = sys.argv[1], float(sys.argv[2]), [float(x) for x in sys.argv[3].split(',')]
args = sys.argv[4:]; bx = (600, 1150, 1120, 1900)
if args and ',' in args[0]: bx = tuple(map(int, args[0].split(','))); args = args[1:]
W, H, FPS, A, asp = 960, 540, 30, 5504 / 3072, 960 / 540
PUSH = (0.51913, 0.63459, 0.5784); FULL = (A / 2, 0.5, 1.0)
inout = lambda u: 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2
def cam(t):
    v = inout(min(1, max(0, (t - 194.06) / (195.40 - 194.06)))); return [FULL[i] + (PUSH[i] - FULL[i]) * v for i in range(3)]
def scr(t, sx, sy):
    cx, cy, h = cam(t); return ((sx / 3072 - (cx - h * asp / 2)) / (h * asp) * W, ((cy + h / 2) - (1 - sy / 3072)) / h * H)
def frame(clip, t):
    n = round((t - T0) * FPS)
    raw = subprocess.run([FF, '-loglevel', 'error', '-i', clip, '-vf', f'select=eq(n\\,{n})', '-vsync', '0', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(H, W, 3)
HT = 420; rows = []
for clip in args:
    tiles = []
    for t in ts:
        f = frame(clip, t); x0, y0 = scr(t, bx[0], bx[1]); x1, y1 = scr(t, bx[2], bx[3])
        x0, y0, x1, y1 = max(0, int(x0)), max(0, int(y0)), min(W, int(x1 + 1)), min(H, int(y1 + 1))
        c = f[y0:y1, x0:x1]; k = HT / c.shape[0]; c = cv2.resize(c, (int(c.shape[1] * k), HT), interpolation=cv2.INTER_LANCZOS4)
        cv2.putText(c, f'{t:.2f} x{k:.1f}', (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 200), 1); tiles.append(c)
    rows.append(np.concatenate(tiles, 1))
wmax = max(r.shape[1] for r in rows); rows = [np.pad(r, ((0, 0), (0, wmax - r.shape[1]), (0, 0)), constant_values=255) for r in rows]
cv2.imwrite(out, np.concatenate(rows, 0)); print(out, np.concatenate(rows, 0).shape)
