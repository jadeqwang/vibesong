"""frames_at.py MP4 START OUT.jpg t1 t2 ... : labelled sheet of frames at song times (MP4 starts at frame round(START*30))"""
import sys, subprocess, numpy as np
from PIL import Image, ImageDraw
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
mp4, start, out, *ts = sys.argv[1:]; f0 = round(float(start) * 30)
ims = []
for t in ts:
    n = round(float(t) * 30) - f0
    raw = subprocess.run([FF, "-v", "error", "-i", mp4, "-vf", f"select=eq(n\\,{n}),scale=480:270", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    im = Image.frombytes("RGB", (480, 270), raw[:480 * 270 * 3]); d = ImageDraw.Draw(im); d.rectangle((0, 0, 70, 14), fill=(0, 0, 0)); d.text((3, 2), f"{float(t):.3f}", fill=(255, 255, 0)); ims.append(im)
cols = 4; rows = (len(ims) + cols - 1) // cols; S = Image.new("RGB", (480 * cols, 270 * rows))
for i, im in enumerate(ims): S.paste(im, ((i % cols) * 480, (i // cols) * 270))
S.save(out, quality=88)
