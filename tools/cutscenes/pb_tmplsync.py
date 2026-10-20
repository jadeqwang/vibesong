"""v4.3: lag from a PHONEME TEMPLATE (expected mouth openness from the stem's word map) instead of the envelope (useless on legato lines).
    $OSPY tools/cutscenes/pb_tmplsync.py TAKE.mp4 S0 CARD [CROP x0,y0,x1,y1]     CARD 03|04|05|06
Template segments are song times measured on the vocal stem (03: M3 word map; 04: v4.3 RMS/fricative map). Prints the best lags
(clip t = song t - S0 + lag) and the closure-event error per labial at the best lag."""
import sys, numpy as np, cv2, mediapipe as mp
take, s0, card = sys.argv[1], float(sys.argv[2]), sys.argv[3]
crop = [float(v) for v in sys.argv[4].split(',')] if len(sys.argv) > 4 else None
SEG = {"03": [(19.92, 20.08, .45), (20.08, 20.13, 0), (20.14, 20.25, .7), (20.26, 20.31, .35), (20.33, 20.95, 1), (20.98, 21.13, .4),
              (21.14, 21.19, 0), (21.20, 21.42, 1), (21.42, 21.49, .6), (21.50, 21.63, 0), (21.65, 21.95, 1)],
       "04": [(48.44, 48.70, 1), (48.72, 48.79, .35), (48.80, 49.16, .75), (49.18, 49.29, .35), (49.30, 49.34, .15), (49.36, 49.60, 1),
              (49.62, 49.71, .35), (49.72, 49.77, 0), (49.80, 50.04, 1), (50.06, 50.22, .35), (50.24, 50.50, .8), (50.52, 50.58, .15), (50.62, 50.82, .8)],
       # (v4.4) card 05 世界 是我的舞台, stem RMS / >3 kHz map (v44_paper.md): shi 106.98-107.64 | stop | jie 107.70-108.17 | shi 108.20-108.78 |
       # wo 108.81-109.10 | de 109.11-109.50 | stop | wu 109.62-109.83 | gap | tai 109.92-110.40
       "05": [(106.98, 107.23, .3), (107.25, 107.63, .5), (107.65, 107.69, .1), (107.70, 107.85, .3), (107.88, 108.17, .9), (108.20, 108.44, .3),
              (108.48, 108.78, .5), (108.81, 108.95, .35), (108.98, 109.10, .7), (109.11, 109.14, .2), (109.15, 109.50, .6), (109.53, 109.60, .1),
              (109.62, 109.83, .35), (109.86, 109.90, .1), (109.92, 110.03, .3), (110.04, 110.40, 1)],
       # (v4.7 v47_cards) card 06 "I just ask myself what it is", stem RMS / >3 kHz map like 04: I ..143.52 | j 143.56-143.64 | ust 143.66-144.00 |
       # st 144.02-144.12 + stop 144.14 | ask 144.18-144.38 | sk 144.40-144.50 | m 144.51-144.56 | my 144.58-144.82 | s 144.84-144.98 | elf 145.02-145.26 |
       # f 145.28-145.34 | what 145.36-145.56 | t | it 145.64-145.76 | is 145.78-146.14 | z 146.16-146.48
       "06": [(143.30, 143.52, 1), (143.56, 143.64, .35), (143.66, 144.00, .75), (144.02, 144.12, .35), (144.13, 144.16, .15), (144.18, 144.38, 1),
              (144.40, 144.50, .35), (144.51, 144.56, 0), (144.58, 144.82, 1), (144.84, 144.98, .35), (145.02, 145.26, .8), (145.28, 145.34, .15),
              (145.36, 145.56, .8), (145.58, 145.62, .3), (145.64, 145.76, .5), (145.78, 146.14, .7), (146.16, 146.48, .3)]}[card]
LAB = {"03": [("b because", 20.13), ("m my", 21.19), ("m imagination", 21.64)], "04": [("t just", 49.34), ("m myself", 49.78), ("f myself", 50.58)], "05": [("stop shi|jie", 107.67), ("stop de|wu", 109.56), ("gap wu|tai", 109.88)],
       "06": [("t just", 144.15), ("m myself", 144.54), ("f myself", 145.31)]}[card]
cap = cv2.VideoCapture(take); fps = cap.get(cv2.CAP_PROP_FPS)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3)
g = []
while True:
    ok, f = cap.read()
    if not ok: break
    if crop: h, w = f.shape[:2]; f = f[int(crop[1] * h):int(crop[3] * h), int(crop[0] * w):int(crop[2] * w)]
    h, w = f.shape[:2]; r = fm.process(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks: g.append(np.nan); continue
    L = r.multi_face_landmarks[0].landmark; P = lambda i: np.array([L[i].x * w, L[i].y * h])
    g.append(np.linalg.norm(P(13) - P(14)) / np.linalg.norm(P(10) - P(152)))
g = np.array(g); ok = ~np.isnan(g); g = np.interp(np.arange(len(g)), np.where(ok)[0], g[ok]); tc = np.arange(len(g)) / fps
ts = np.arange(SEG[0][0], SEG[-1][1], 0.01)
E = np.full(len(ts), np.nan)
for a, b, v in SEG: E[(ts >= a) & (ts < b)] = v
m = ~np.isnan(E); ts, E = ts[m], E[m]
import os; RG = float(os.environ.get('RANGE', '0.7'))   # slot clips: RANGE=0.25 and the template is trimmed to the clip
m = (ts - s0 - RG >= 0) & (ts - s0 + RG <= tc[-1]); ts, E = ts[m], E[m]
res = []
for lag in np.arange(-RG, RG + 0.001, 0.01):
    ct = ts - s0 + lag
    if ct.min() < 0 or ct.max() > tc[-1]: continue
    y = np.interp(ct, tc, g); res.append((np.corrcoef(y, E)[0, 1], lag))
res.sort(reverse=True); best = res[0][1]
print(f"{take.split('/')[-1]}: best lag {best:+.2f} (r {res[0][0]:.2f}); next " + ", ".join(f"{l:+.2f}({c:.2f})" for c, l in res[1:12:3]))
# local minima of the mouth curve near each labial at the best lag
for lab, t in LAB:
    ct = t - s0 + best; i0, i1 = np.searchsorted(tc, ct - .2), np.searchsorted(tc, ct + .2); k = i0 + int(np.argmin(g[i0:i1]))
    print(f"   {lab:16s} stem {t:6.2f}  take min at {tc[k] + s0 - best:6.2f} (gap {g[k]:.3f})  err {tc[k] + s0 - best - t:+.2f}")
