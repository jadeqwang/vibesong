"""Pass B paper M2 checks on a section mp4 that starts at song time START (540p, 30 fps):
  luma-drop scan (YAVG frame-to-frame drop > 35 at 160 px), hard cuts (scene > 0.35) vs the beat grid (beats + 8ths) and cues,
  a 1 fps contact sheet labelled in song time (+ the frames either side of every cut).
    .venv/bin/python tools/cutscenes/pb_m2check.py VIDEO.mp4 START OUT_PREFIX"""
import sys, subprocess, re, json, numpy as np
from PIL import Image, ImageDraw, ImageFont
FF = '/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
v, start, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
R = '/home/jade/Documents/vibesong/'
lines = []
o = subprocess.run([FF, '-v', 'info', '-i', v, '-an', '-vf', 'scale=160:-2,signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'], capture_output=True, text=True).stderr
ys = np.array([float(m) for m in re.findall(r'lavfi\.signalstats\.YAVG=([\d.]+)', o)])
drops = [(start + (i + 1) / 30, ys[i], ys[i + 1]) for i in range(len(ys) - 1) if ys[i] - ys[i + 1] > 35]
lines.append(f'LUMA frames={len(ys)} min YAVG={ys.min():.1f} drops>35: ' + (', '.join(f'{t:.3f} ({a:.0f}->{b:.0f})' for t, a, b in drops) or 'none'))
o = subprocess.run([FF, '-i', v, '-an', '-vf', "scale=320:-2,select='gt(scene,0.35)',showinfo", '-f', 'null', '-'], capture_output=True, text=True).stderr
cuts = [start + float(x) for x in re.findall(r'pts_time:([\d.]+)', o)]
tj = json.load(open(R + 'analysis/timing.json'))
beats = np.array([b['t'] if isinstance(b, dict) else b for b in tj['beat_grid']['beats']], float)
grid = np.sort(np.concatenate([beats, (beats[:-1] + beats[1:]) / 2]))
for c in cuts:
    i = np.argmin(np.abs(grid - c)); off = (c - grid[i]) * 1000
    lines.append(f'CUT {c:8.3f}  nearest 8th {grid[i]:8.3f}  off {off:+5.0f} ms  {"ON" if abs(off) <= 20 else "near" if abs(off) <= 60 else "OFF"}  (frame quantum 33 ms)')
open(out + '_checks.txt', 'w').write('\n'.join(lines) + '\n'); print('\n'.join(lines))
# 1 fps sheet + cut neighbours
n = len(ys); ks = sorted(set(list(range(0, n, 30)) + [k for c in cuts for k in (round((c - start) * 30) - 1, round((c - start) * 30)) if 0 <= k < n]))
fr = []
for k in ks:
    raw = subprocess.run([FF, '-v', 'error', '-i', v, '-vf', f'select=eq(n\\,{k}),scale=480:270', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    im = Image.frombytes('RGB', (480, 270), raw); d = ImageDraw.Draw(im); d.rectangle((0, 0, 92, 20), fill=(0, 0, 0)); d.text((4, 4), f't{start + k / 30:.3f}', fill=(255, 220, 0)); fr.append(im)
cols = 4; rows = (len(fr) + cols - 1) // cols; S = Image.new('RGB', (480 * cols, 270 * rows))
for i, im in enumerate(fr): S.paste(im, ((i % cols) * 480, (i // cols) * 270))
S.save(out + '_sheet.jpg', quality=85); print(out + '_sheet.jpg', len(fr), 'frames')
