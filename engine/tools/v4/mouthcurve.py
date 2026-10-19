"""mouthcurve.py CARD.mp4 slot_t0 -> per-frame mouth openness (dark px in the mouth box) + vocal-stem onset near the first word"""
import sys, subprocess, numpy as np, os
FF = os.path.join(os.path.dirname(__file__), '../../../.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2')
f, t0 = sys.argv[1], float(sys.argv[2]); X, Y, W, H = 930, 420, 72, 36
raw = subprocess.run([FF, '-v', 'error', '-i', f, '-vf', f'crop={W}:{H}:{X}:{Y}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(float)
op = (fr < 95).sum(axis=(1, 2))
print('frames', len(op)); print(' '.join(f'{t0 + i/30:.3f}:{int(v)}' for i, v in enumerate(op[:24])))
base = np.median(op[:2]); k = next((i for i, v in enumerate(op) if v > base + 25), None)
print('first opening frame', k, 'song t', None if k is None else round(t0 + k / 30, 3))
voc = '/home/jade/Documents/vibesong/work/demucs/htdemucs_ft/song/vocals.wav'
y = np.frombuffer(subprocess.run([FF, '-v', 'error', '-ss', f'{t0 - 0.3:.3f}', '-t', '1.0', '-i', voc, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
hop = 80; env = np.array([np.sqrt(np.mean(y[i:i + hop] ** 2)) for i in range(0, len(y) - hop, hop)]); db = 20 * np.log10(env + 1e-6)
thr = np.percentile(db, 10) + 0.5 * (np.percentile(db, 95) - np.percentile(db, 10)); j = next(i for i, v in enumerate(db) if v > thr)
print('vocal onset (5 ms env, half-range threshold) song t', round(t0 - 0.3 + j * hop / 16000, 3))
