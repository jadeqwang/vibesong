"""lumascan.py video.mp4 [--start s] [--thr 35] [--up]  -> per-frame YAVG; flags frame-to-frame drops (and rises with --up) over thr.
Prints flagged frames as song time = start + frame/30. Also --range a b prints YAVG for frames in [a,b) seconds."""
import sys, subprocess, os, re
FF = os.path.join(os.path.dirname(__file__), '../../../.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2')
f = sys.argv[1]; start = 0.0; thr = 35.0; up = '--up' in sys.argv; rng = None
if '--start' in sys.argv: start = float(sys.argv[sys.argv.index('--start') + 1])
if '--thr' in sys.argv: thr = float(sys.argv[sys.argv.index('--thr') + 1])
if '--range' in sys.argv: i = sys.argv.index('--range'); rng = (float(sys.argv[i + 1]), float(sys.argv[i + 2]))
out = subprocess.run([FF, '-v', 'info', '-i', f, '-an', '-vf', 'scale=160:-2,signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'], capture_output=True, text=True).stderr
ys = [float(m) for m in re.findall(r'lavfi\.signalstats\.YAVG=([\d.]+)', out)]
print(f'frames {len(ys)}  ({len(ys)/30:.2f} s)')
flags = []
for i in range(1, len(ys)):
    d = ys[i] - ys[i - 1]
    if d < -thr or (up and d > thr): flags.append((i, d))
for i, d in flags:
    t = start + i / 30
    # one-frame blip = drop then recover within 2 frames
    rec = max(ys[i + 1:i + 3]) - ys[i] if i + 1 < len(ys) else 0
    print(f'frame {i:5d} t={t:8.3f}  dY={d:+6.1f}  Y={ys[i]:6.1f} prev={ys[i-1]:6.1f} next={ys[i+1] if i+1<len(ys) else -1:6.1f}  {"BLIP" if rec > thr*0.8 else ""}')
if rng:
    for i in range(int(round((rng[0]-start)*30)), int(round((rng[1]-start)*30))):
        if 0 <= i < len(ys): print(f'  {start+i/30:8.3f} {ys[i]:6.1f}')
