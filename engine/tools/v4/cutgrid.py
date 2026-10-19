"""cutgrid.py video.mp4 [--thr 0.35] -> hard cuts (scene score > thr) vs the measured beat grid (beats + 8ths, timing.json)
A cut lands on frame k = it is visible from t = k/30. Offset = cut time - nearest grid time (8th). Reports |off| <= 20 ms."""
import sys, subprocess, re, json, os, numpy as np
FF = os.path.join(os.path.dirname(__file__), '../../../.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2')
f = sys.argv[1]; thr = float(sys.argv[sys.argv.index('--thr') + 1]) if '--thr' in sys.argv else 0.35
out = subprocess.run([FF, '-i', f, '-an', '-vf', f"scale=320:-2,select='gt(scene,{thr})',showinfo", '-f', 'null', '-'], capture_output=True, text=True).stderr
cuts = [float(x) for x in re.findall(r'pts_time:([\d.]+)', out)]
tj = json.load(open(os.path.join(os.path.dirname(__file__), '../../../analysis/timing.json')))
beats = np.array([b['t'] if isinstance(b, dict) else b for b in tj['beat_grid']['beats']], float)
grid = np.sort(np.concatenate([beats, (beats[:-1] + beats[1:]) / 2]))
acc = [a['t'] for a in tj.get('accent_hits', [])]
cj = json.load(open(os.path.join(os.path.dirname(__file__), '../../data/cues.json')))
def nums(o):
    if isinstance(o, (int, float)) and not isinstance(o, bool): yield float(o)
    elif isinstance(o, list): 
        for x in o: yield from nums(x)
    elif isinstance(o, dict):
        for k, x in o.items():
            if not k.startswith('_'): yield from nums(x)
cues = [x for x in nums(cj) if 0 < x < 210]
hits = np.sort(np.array(acc + cues + [d['impact_s'] for d in tj['drops']], float))
rows = []
for c in cuts:
    i = np.argmin(np.abs(grid - c)); off = c - grid[i]
    j = np.argmin(np.abs(hits - c)); offh = c - hits[j]
    if abs(offh) < abs(off): rows.append((c, hits[j], offh * 1000, 'cue'))
    else: rows.append((c, grid[i], off * 1000, '8th'))
on = [r for r in rows if abs(r[2]) <= 20]; near = [r for r in rows if 20 < abs(r[2]) <= 60]; off = [r for r in rows if abs(r[2]) > 60]
for c, g, o, k in rows: print(f'cut {c:8.3f}  {k:3s} {g:8.3f}  off {o:+6.0f} ms  {"ON" if abs(o) <= 20 else "near" if abs(o) <= 60 else "off-grid"}')
print(f'SUMMARY cuts={len(rows)} on-grid(<=20ms)={len(on)} near(20-60)={len(near)} off(>60)={len(off)}')
