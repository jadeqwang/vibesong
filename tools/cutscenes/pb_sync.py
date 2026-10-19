"""Pass B lip-sync measurement (OS venv). Mouth-open curve (FaceMesh inner-lip gap / face height) of a take vs the demucs vocal-stem
envelope, correlated over a PLAUSIBLE lag range only (default -0.4..+0.8 s; Veo takes: --range=-1,3).
    $OSPY tools/cutscenes/pb_sync.py TAKE.mp4 S0 WIN_A WIN_B OUT_PREFIX [--range=a,b] [--face=x0,y0,x1,y1 (crop, frac)]
lag: clip time = song time - S0 + lag. Writes OUT.sync.json + OUT.sync.png (curves at lag 0 and at the best lag)."""
import sys, json, subprocess, numpy as np, cv2, mediapipe as mp
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
VOC = "/home/jade/Documents/vibesong/work/demucs/htdemucs_ft/song/vocals.wav"
a = [x for x in sys.argv[1:] if not x.startswith('--')]; o = dict(x[2:].split('=', 1) for x in sys.argv[1:] if x.startswith('--'))
take, s0, wa, wb, out = a[0], float(a[1]), float(a[2]), float(a[3]), a[4]
rng = [float(v) for v in o.get('range', '-0.4,0.8').split(',')]
crop = [float(v) for v in o['face'].split(',')] if 'face' in o else None
cap = cv2.VideoCapture(take); fps = cap.get(cv2.CAP_PROP_FPS)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3)
gap = []
while True:
    ok, f = cap.read()
    if not ok: break
    if crop: h, w = f.shape[:2]; f = f[int(crop[1] * h):int(crop[3] * h), int(crop[0] * w):int(crop[2] * w)]
    h, w = f.shape[:2]; r = fm.process(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks: gap.append(np.nan); continue
    L = r.multi_face_landmarks[0].landmark; P = lambda i: np.array([L[i].x * w, L[i].y * h])
    gap.append(np.linalg.norm(P(13) - P(14)) / np.linalg.norm(P(10) - P(152)))
g = np.array(gap); n = len(g); ok = ~np.isnan(g); g = np.interp(np.arange(n), np.where(ok)[0], g[ok])
raw = subprocess.run([FF, "-v", "error", "-ss", f"{s0 - 2:.3f}", "-t", f"{n / fps + 6:.3f}", "-i", VOC, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
y = np.frombuffer(raw, np.float32); hop = 16000 / 240                       # envelope at 240 Hz, song time s0-2 ..
env = np.array([np.sqrt(np.mean(y[int(i * hop):int((i + 1) * hop)] ** 2) + 1e-12) for i in range(int(len(y) / hop))])
env = 20 * np.log10(env + 1e-6); env = np.clip((env - np.percentile(env, 20)) / (np.percentile(env, 98) - np.percentile(env, 20) + 1e-6), 0, 1)
et = np.arange(len(env)) / 240 + s0 - 2
env = np.convolve(env, np.ones(9) / 9, 'same')
T = np.arange(wa, wb, 1 / 120)                                              # song-time sample grid inside the window
E = np.interp(T, et, env); E = (E - E.mean()) / (E.std() + 1e-9)
res = []
for L in np.arange(rng[0], rng[1] + 1e-9, 1 / 120):
    ct = T - s0 + L
    if ct.min() < 0 or ct.max() > (n - 1) / fps: continue
    M = np.interp(ct * fps, np.arange(n), g); M = (M - M.mean()) / (M.std() + 1e-9); res.append((float(np.mean(E * M)), round(float(L), 3)))
res.sort(reverse=True)
c0 = [c for c, l in res if abs(l) < 1e-6]
rep = {"take": take, "s0": s0, "win": [wa, wb], "fps": fps, "frames": n, "face_found": int(ok.sum()), "range": rng,
       "best_lag_s": res[0][1], "corr": round(res[0][0], 3), "corr_at_0": round(c0[0], 3) if c0 else None,
       "top": [(l, round(c, 3)) for c, l in res[:8]]}
json.dump(rep, open(out + ".sync.json", "w"), indent=1)
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
fig, ax = plt.subplots(1, 1, figsize=(13, 3.2))
ax.plot(et, (env - env.min()) / (np.ptp(env) + 1e-9), color="#e0572a", label="vocal stem env")
for L, col in ((0.0, "#999999"), (rep["best_lag_s"], "#2a64e0")):
    ax.plot(np.arange(n) / fps + s0 - L, (g - g.min()) / (np.ptp(g) + 1e-9), color=col, label=f"mouth @lag {L:+.3f}")
ax.axvspan(wa, wb, alpha=.1); ax.set_xlim(s0 - 0.3, s0 + n / fps); ax.legend(fontsize=8); ax.set_title(json.dumps({k: rep[k] for k in ("best_lag_s", "corr", "corr_at_0")}), fontsize=9)
fig.tight_layout(); fig.savefig(out + ".sync.png", dpi=80); print(json.dumps(rep))
