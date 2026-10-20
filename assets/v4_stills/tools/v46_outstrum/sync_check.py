#!/usr/bin/env python3
"""v46_outstrum sync check (the v45_open measure): per-frame motion energy in Charlie's forearm/hand box on the rendered clip;
its peaks (the fastest point = the hand crossing the strings) vs the strum crossings (measured onsets).
The outro camera push is undone analytically (spread.js camera: full spread -> PUSH over OUT.push, inOut), so every frame is
resampled into spread px first; then frame-to-frame |diff| inside the arm footprint box (minus the same in a control box on the
static body) = motion energy at the pair midpoint. Peak times are refined by a parabola through the 3 samples.
usage: OSPY tools/v46_outstrum/sync_check.py CLIP.mp4 CLIP_T0 [groove|strum] [ref.mp4]"""
import sys, subprocess, numpy as np, cv2, json
FF = '/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
clip, T0 = sys.argv[1], float(sys.argv[2]); var = sys.argv[3] if len(sys.argv) > 3 else 'groove'
W, H, FPS = 960, 540, 30
A = 5504 / 3072; asp = W / H
PUSH = (0.51913, 0.63459, 0.5784); FULL = (A / 2, 0.5, 1.0)
inout = lambda u: 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2
def cam(t):
    v = inout(min(1, max(0, (t - 194.06) / (195.40 - 194.06))))
    return [FULL[i] + (PUSH[i] - FULL[i]) * v for i in range(3)]
X = {'groove': [194.033, 194.285, 194.495, 194.706, 194.931, 195.160, 195.375, 195.594, 195.829, 196.055, 196.280, 196.510, 196.727],
     'strum': [194.033, 194.495, 194.931, 195.375, 195.829, 196.280, 196.727]}[var]
ta, tb = 193.6, 195.72                                     # the rainbow wipe reaches Charlie at ~195.75 (huge energy spike there)
f0, f1 = round((ta - T0) * FPS), round((tb - T0) * FPS)
raw = subprocess.run([FF, '-loglevel', 'error', '-i', clip, '-vf', f'select=between(n\\,{f0}\\,{f1})', '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                     capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
# canonical spread-px window around Charlie's arm + body at 1 px = 1 spread px / 2
SX0, SY0, SX1, SY1, S = 520, 1300, 1040, 1720, 0.5
gx, gy = np.meshgrid(np.arange(SX0, SX1, 1 / S), np.arange(SY0, SY1, 1 / S))
def canon(img, t):
    cx, cy, h = cam(t); left, top = cx - h * asp / 2, cy + h / 2
    px = ((gx / 3072) - left) / (h * asp) * W - 0.5; py = (top - (1 - gy / 3072)) / h * H - 0.5
    return cv2.remap(img, px.astype(np.float32), py.astype(np.float32), cv2.INTER_LINEAR)
L = json.load(open('/home/jade/Documents/vibesong/media/act5/tex/strum46.json'))['arm46']
ab = (L['x'] - 40, L['y'] - 40, L['x'] + L['w'] + 40, L['y'] + L['h'] + 40)        # the swing area
cb = (880, 1430, 1000, 1560)                                                         # control: the T-shirt / guitar top right of the arm
box = lambda b: (slice(int((b[1] - SY0) * S), int((b[3] - SY0) * S)), slice(int((b[0] - SX0) * S), int((b[2] - SX0) * S)))
C = [canon(fr[i], T0 + (f0 + i) / FPS) for i in range(len(fr))]
E, Ec, tm = [], [], []
for i in range(1, len(C)):
    d = np.abs(C[i] - C[i - 1]); E.append(d[box(ab)].mean()); Ec.append(d[box(cb)].mean()); tm.append(T0 + (f0 + i - 0.5) / FPS)
E = np.array(E) - np.array(Ec); tm = np.array(tm)
print('frame-pair motion energy (arm box minus control), t = pair midpoint:')
for t, e in zip(tm, E): print('  %.3f %s' % (t, '#' * int(max(0, e) * 8)))
pk = [i for i in range(1, len(E) - 1) if E[i] > E[i - 1] and E[i] >= E[i + 1] and E[i] > 0.25 * E.max()]
res = []
for i in pk:
    a, b, c = E[i - 1], E[i], E[i + 1]; off = 0.5 * (a - c) / (a - 2 * b + c) if (a - 2 * b + c) != 0 else 0
    tp = tm[i] + off / FPS; x = min(X, key=lambda q: abs(q - tp)); res.append((tp, x, (tp - x) * 1000))
print('\npeaks (refined) -> nearest crossing, error ms:')
for tp, x, e in res: print('  %.3f  %.3f  %+5.0f ms %s' % (tp, x, e, '' if abs(e) <= 34 else '  <-- > 1 frame'))
m = [x for x in X if ta < x < tb]; hit = [x for x in m if any(abs(r[1] - x) < 1e-6 and abs(r[2]) <= 34 for r in res)]
print(f'\n{len(hit)}/{len(m)} crossings in [{ta}, {tb}] have a motion peak within 1 frame (34 ms)')
