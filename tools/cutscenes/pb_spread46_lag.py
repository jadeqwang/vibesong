"""v4.6 v46_outro: Jade's lip lag in the outro spread clip vs the vocal stem (events, not envelope correlation: the line is legato).
Mouth-open curve (FaceMesh inner-lip gap / face height) on an upsampled face crop, printed per clip frame as SONG time at lag 0
(song t = clip t + S0), next to the vocal-stem level, plus a contact sheet of mouth crops around the word events.
    $OSPY tools/cutscenes/pb_spread46_lag.py TAKE.mp4 OUT_PREFIX [S0=186.30] [CROP=0.40,0.05,0.66,0.45]
Writes OUT.curve.json (t_song, gap, stem_db) and OUT.sheet.jpg. Lag convention (spread.js rt.lag): clip t = song t - S0 + lag,
so a picture that runs LATE by d seconds is fixed by lag = +d."""
import sys, json, subprocess, numpy as np, cv2, mediapipe as mp
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
VOC = "/home/jade/Documents/vibesong/work/demucs/htdemucs_ft/song/vocals.wav"
take, out = sys.argv[1], sys.argv[2]
s0 = float(sys.argv[3]) if len(sys.argv) > 3 else 186.30
crop = [float(v) for v in (sys.argv[4] if len(sys.argv) > 4 else "0.40,0.05,0.66,0.45").split(',')]
cap = cv2.VideoCapture(take); fps = cap.get(cv2.CAP_PROP_FPS)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3)
gap, mouths, k = [], [], 0
while True:
    ok, f = cap.read()
    if not ok: break
    h, w = f.shape[:2]; c = f[int(crop[1] * h):int(crop[3] * h), int(crop[0] * w):int(crop[2] * w)]
    s = 720 / c.shape[0]; c = cv2.resize(c, None, fx=s, fy=s, interpolation=cv2.INTER_CUBIC); ch, cw = c.shape[:2]
    r = fm.process(cv2.cvtColor(c, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks: gap.append(np.nan); mouths.append(None); k += 1; continue
    L = r.multi_face_landmarks[0].landmark; P = lambda i: np.array([L[i].x * cw, L[i].y * ch])
    gap.append(float(np.linalg.norm(P(13) - P(14)) / np.linalg.norm(P(10) - P(152))))
    m = (P(13) + P(14)) / 2; fh = np.linalg.norm(P(10) - P(152)); R = int(fh * 0.28)
    x0, y0 = int(m[0] - R * 1.3), int(m[1] - R)
    mouths.append(cv2.resize(c[max(0, y0):y0 + 2 * R, max(0, x0):x0 + int(2.6 * R)], (156, 120))); k += 1
g = np.array(gap); n = len(g); ts = np.arange(n) / fps + s0
raw = subprocess.run([FF, "-v", "error", "-ss", f"{s0:.3f}", "-t", f"{n / fps + 0.5:.3f}", "-i", VOC, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                     capture_output=True).stdout
y = np.frombuffer(raw, np.float32)
db = [float(20 * np.log10(np.sqrt(np.mean(y[int((t - s0 - 0.02) * 16000):int((t - s0 + 0.02) * 16000)] ** 2)) + 1e-6)) if t - s0 > 0.02 else -99 for t in ts]
json.dump({"take": take, "s0": s0, "fps": fps, "t": ts.round(4).tolist(), "gap": [None if np.isnan(v) else round(v, 4) for v in g], "stem_db": [round(v, 1) for v in db]},
          open(out + ".curve.json", "w"))
for t, v, d in zip(ts, g, db):
    print(f"{t:8.3f}  stem {d:6.1f} dB  gap {'  ?  ' if np.isnan(v) else f'{v:5.3f}'} " + ('' if np.isnan(v) else '#' * int(v * 300)))
# contact sheet: every frame 186.3 .. end, 12 per row, song time at lag 0 printed on each tile
tiles = []
for i, m in enumerate(mouths):
    t = m.copy() if m is not None else np.zeros((120, 156, 3), np.uint8)
    cv2.rectangle(t, (0, 0), (156, 16), (0, 0, 0), -1)
    cv2.putText(t, f"{ts[i]:.3f} {db[i]:.0f}dB", (2, 12), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (255, 255, 255), 1)
    tiles.append(t)
while len(tiles) % 12: tiles.append(np.zeros((120, 156, 3), np.uint8))
rows = [np.hstack(tiles[i:i + 12]) for i in range(0, len(tiles), 12)]
cv2.imwrite(out + ".sheet.jpg", np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
print("frames", n, "face found", int((~np.isnan(g)).sum()), "->", out + ".curve.json", out + ".sheet.jpg")
