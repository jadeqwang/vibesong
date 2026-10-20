"""v4.7 (v47_cards): plot a take's mouth-openness curve (FaceMesh lip gap / face height) in SONG time at candidate lags, over the
phoneme template of pb_tmplsync.py and the stem's RMS, to settle ambiguous template lags by eye.
    $OSPY tools/cutscenes/pb_mouthplot47.py TAKE.mp4 S0 CARD CROP OUT.png LAG1,LAG2,...   (also writes OUT.npy = clip t, openness)"""
import sys, re, numpy as np, cv2, mediapipe as mp, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
import scipy.io.wavfile as wf
take, s0, card, crop, out, lags = sys.argv[1], float(sys.argv[2]), sys.argv[3], [float(v) for v in sys.argv[4].split(",")], sys.argv[5], [float(v) for v in sys.argv[6].split(",")]
src = open("/home/jade/Documents/vibesong/tools/cutscenes/pb_tmplsync.py").read()
SEG = eval(re.search(r"SEG = (\{.*?\})\[card\]", src, re.S).group(1))[card]
cap = cv2.VideoCapture(take); fps = cap.get(cv2.CAP_PROP_FPS)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3); g = []
while True:
    ok, f = cap.read()
    if not ok: break
    h, w = f.shape[:2]; f = f[int(crop[1] * h):int(crop[3] * h), int(crop[0] * w):int(crop[2] * w)]; h, w = f.shape[:2]
    r = fm.process(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks: g.append(np.nan); continue
    L = r.multi_face_landmarks[0].landmark; P = lambda i: np.array([L[i].x * w, L[i].y * h])
    g.append(np.linalg.norm(P(13) - P(14)) / np.linalg.norm(P(10) - P(152)))
g = np.array(g); tc = np.arange(len(g)) / fps; np.save(out[:-4] + ".npy", np.stack([tc, g]))
sr, x = wf.read("/home/jade/Documents/vibesong/work/demucs/htdemucs_ft/song/vocals.wav"); x = x.astype(float); x = x.mean(1) if x.ndim > 1 else x
A, B = SEG[0][0] - 0.4, SEG[-1][1] + 0.6; hop = int(sr * .01); ts = np.arange(A, B, .01)
rms = np.array([np.sqrt((x[int(t * sr):int(t * sr) + 3 * hop] ** 2).mean()) for t in ts]); rms = 20 * np.log10(rms / 32768 + 1e-9)
fig, ax = plt.subplots(len(lags), 1, figsize=(14, 2.2 * len(lags)), sharex=True)
for a, lag in zip(np.atleast_1d(ax), lags):
    a.plot(ts, (rms + 50) / 30, color="#bbb", lw=1)
    for s, e, v in SEG: a.plot([s, e], [v, v], color="tab:orange", lw=3)
    st = tc + s0 - lag; a.plot(st, g / np.nanmax(g), color="tab:blue", lw=1.5, marker=".", ms=3); a.set_xlim(A, B); a.set_ylabel(f"lag {lag:+.2f}")
    a.grid(alpha=.3)
plt.tight_layout(); plt.savefig(out, dpi=70); print(out)
# closure score per lag: +1 per template closure (v <= .15) the take closes inside (+-0.05 s), -1 per take closure where the template is open (>= .7)
gn = g / np.nanmax(g); closed = gn < 0.15; res = []
for lag in np.arange(-0.8, 0.81, 0.01):
    st = tc + s0 - lag; sc = 0
    for s, e, v in SEG:
        m = (st >= s - 0.05) & (st <= e + 0.05)
        if v <= .15 and m.any(): sc += 1 if closed[m].any() else 0
        if v >= .7 and m.any():
            mm = (st >= s + 0.04) & (st <= e - 0.04)
            if mm.any() and closed[mm].any(): sc -= 1
    res.append((sc, -abs(lag), round(lag, 2)))
res.sort(reverse=True); best = res[0][0]
print("closure score best", best, "at lags", sorted(r[2] for r in res if r[0] == best)[:1], "..", sorted(r[2] for r in res if r[0] == best)[-1:], "n closures in template", sum(1 for s, e, v in SEG if v <= .15))
