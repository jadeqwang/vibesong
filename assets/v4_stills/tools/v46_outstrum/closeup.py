#!/usr/bin/env python3
"""v46_outstrum close-up A/B: Charlie's region from each clip (the crop box follows the outro camera push), side by side, with the
song audio. usage: OSPY tools/v46_outstrum/closeup.py OUT.mp4 CLIP_T0 t0 t1 label1=clip1.mp4 label2=clip2.mp4 ..."""
import sys, subprocess, numpy as np, cv2
FF = '/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
out, T0, ta, tb = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]); clips = [a.split('=', 1) for a in sys.argv[5:]]
W, H, FPS, A, asp = 960, 540, 30, 5504 / 3072, 960 / 540
PUSH = (0.51913, 0.63459, 0.5784); FULL = (A / 2, 0.5, 1.0)
inout = lambda u: 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2
def scr(t, sx, sy):
    v = inout(min(1, max(0, (t - 194.06) / 1.34))); cx, cy, h = [FULL[i] + (PUSH[i] - FULL[i]) * v for i in range(3)]
    return ((sx / 3072 - (cx - h * asp / 2)) / (h * asp) * W, ((cy + h / 2) - (1 - sy / 3072)) / h * H)
BX = (600, 1150, 1120, 1900); TW, TH = 316, 456          # tile: ~2x at the end of the push (~3.5x at its start)
f0, f1 = round((ta - T0) * FPS), round((tb - T0) * FPS)
def frames(p):
    raw = subprocess.run([FF, '-loglevel', 'error', '-i', p, '-vf', f'select=between(n\\,{f0}\\,{f1 - 1})', '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
F = [frames(p) for _, p in clips]
enc = subprocess.Popen([FF, '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{TW * len(clips)}x{TH}', '-r', str(FPS), '-i', '-',
                        '-ss', str(ta - T0), '-t', str(tb - ta), '-i', clips[0][1], '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '16',
                        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', out], stdin=subprocess.PIPE)
for i in range(f1 - f0):
    t = T0 + (f0 + i) / FPS; x0, y0 = scr(t, BX[0], BX[1]); x1, y1 = scr(t, BX[2], BX[3])
    M = cv2.getAffineTransform(np.float32([[x0, y0], [x1, y0], [x0, y1]]), np.float32([[0, 0], [TW, 0], [0, TH]]))
    tiles = []
    for (lab, _), fr in zip(clips, F):
        c = cv2.warpAffine(fr[i], M, (TW, TH), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
        cv2.putText(c, lab, (6, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 190), 1); cv2.putText(c, f'{t:.2f}', (TW - 60, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (90, 90, 90), 1)
        tiles.append(c)
    enc.stdin.write(np.concatenate(tiles, 1).tobytes())
enc.stdin.close(); enc.wait(); print(out)
