"""Frame-indexed diff of two mp4s.
usage: framediff.py A.mp4 a_start_frame B.mp4 b_start_frame n [--w 480] [--img out_prefix frames...]
Prints per-frame mean-abs / max-abs / PSNR (RGB, scaled to --w) and a summary."""
import sys, subprocess, numpy as np, os
FF = os.path.join(os.path.dirname(__file__), '../../../.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2')
a, a0, b, b0, n = sys.argv[1], int(sys.argv[2]), sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
W = 480; img = None; imgf = []
if '--w' in sys.argv: W = int(sys.argv[sys.argv.index('--w') + 1])
if '--img' in sys.argv:
    i = sys.argv.index('--img'); img = sys.argv[i + 1]; imgf = [int(x) for x in sys.argv[i + 2:] if x.isdigit()]
def probe(f):
    out = subprocess.run([FF, '-i', f], capture_output=True, text=True).stderr
    import re; m = re.search(r', (\d{2,5})x(\d{2,5})', out); return int(m.group(1)), int(m.group(2))
def reader(f, s0):
    w, h = probe(f); H = round(h * W / w / 2) * 2
    p = subprocess.Popen([FF, '-v', 'error', '-i', f, '-vf', f'trim=start_frame={s0}:end_frame={s0+n},setpts=PTS-STARTPTS,scale={W}:{H}:flags=area',
                          '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    for _ in range(n):
        buf = p.stdout.read(W * H * 3)
        if len(buf) < W * H * 3: break
        yield np.frombuffer(buf, np.uint8).reshape(H, W, 3)
rows = []
for k, (x, y) in enumerate(zip(reader(a, a0), reader(b, b0))):
    d = np.abs(x.astype(np.int16) - y.astype(np.int16)); mse = (d.astype(np.float32) ** 2).mean()
    psnr = 99.0 if mse == 0 else 10 * np.log10(255 ** 2 / mse)
    rows.append((k, d.mean(), d.max(), psnr, (d > 24).mean() * 100))
    print(f'{k:4d} mean {d.mean():6.2f} max {d.max():3d} psnr {psnr:6.2f} px>24 {rows[-1][4]:5.2f}%')
    if img and k in imgf:
        from PIL import Image
        Image.fromarray(np.concatenate([x, y, np.clip(d * 4, 0, 255).astype(np.uint8)], 1)).save(f'{img}_{k}.jpg', quality=88)
r = np.array([r[1:] for r in rows])
print(f'SUMMARY n={len(rows)} mean_abs={r[:,0].mean():.3f} worst_mean_abs={r[:,0].max():.2f} max_abs={int(r[:,1].max())} psnr_mean={r[:,2].mean():.2f} psnr_min={r[:,2].min():.2f} worst_px>24={r[:,3].max():.2f}%')
