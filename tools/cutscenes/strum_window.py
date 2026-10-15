"""Pick the 1.205 s window of a playing take whose strum accents best land on the slot's beats (128.18, 128.582, 128.985).
Strum energy = frame-difference energy inside the strumming-hand box (normalised x0,y0,x1,y1).
    python tools/cutscenes/strum_window.py CLIP.mp4 x0,y0,x1,y1 [skip=0.8]"""
import sys, json, numpy as np, av
clip = sys.argv[1]; box = [float(v) for v in sys.argv[2].split(",")]; skip = float(sys.argv[3]) if len(sys.argv) > 3 else 0.8
fr = []
with av.open(clip) as c:
    st = c.streams.video[0]; fps = float(st.average_rate)
    for f in c.decode(st):
        a = f.to_ndarray(format="gray").astype(np.float32); h, w = a.shape
        fr.append(a[int(box[1] * h):int(box[3] * h), int(box[0] * w):int(box[2] * w)])
e = np.array([0] + [np.abs(fr[i] - fr[i - 1]).mean() for i in range(1, len(fr))])
es = (e - e.mean()) / (e.std() + 1e-9)
BEATS = [0.0, 0.402, 0.805]; n = round(1.205 * fps); best = []
for s in range(round(skip * fps), len(e) - n + 1):
    sc = np.mean([es[max(0, s + round(b * fps) - 1):s + round(b * fps) + 2].max() for b in BEATS])
    best.append((round(float(sc), 3), round(s / fps, 3)))
best.sort(reverse=True)
peaks = [round(i / fps, 2) for i in range(1, len(es) - 1) if es[i] > 0.8 and es[i] >= es[i - 1] and es[i] >= es[i + 1]]
print(json.dumps({"clip": clip, "fps": fps, "frames": len(e), "motion_mean": round(float(e.mean()), 2), "peaks_s": peaks,
                  "best_windows": best[:5]}))
