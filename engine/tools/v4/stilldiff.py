"""stilldiff.py video.mp4 frame_index still.png  -> mean/max abs + PSNR (RGB, full res)"""
import sys, subprocess, numpy as np, os
from PIL import Image
FF = os.path.join(os.path.dirname(__file__), '../../../.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2')
v, fi, png = sys.argv[1], int(sys.argv[2]), sys.argv[3]
s = np.asarray(Image.open(png).convert('RGB')).astype(np.int16); H, W = s.shape[:2]
raw = subprocess.run([FF, '-v', 'error', '-i', v, '-vf', f'select=eq(n\\,{fi}),scale={W}:{H}', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.uint8).reshape(H, W, 3).astype(np.int16); d = np.abs(x - s); mse = (d.astype(np.float32) ** 2).mean()
print(f'{os.path.basename(png)} vs {os.path.basename(v)}#{fi}: mean {d.mean():.2f} max {d.max()} psnr {10*np.log10(255**2/max(mse,1e-9)):.2f} px>24 {(d>24).mean()*100:.2f}%')
