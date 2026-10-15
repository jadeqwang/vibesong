"""Segment the vocal stem into notes: voiced runs split at pitch jumps (>0.7 st) or energy dips. Saves work/notes.json."""
import json, numpy as np, librosa
sr = 22050; hop = 220  # 10 ms
v = librosa.load('work/demucs/htdemucs_ft/song/vocals.wav', sr=sr, mono=True)[0]
f0, vf, vp = librosa.pyin(v, fmin=110, fmax=1000, sr=sr, hop_length=hop, frame_length=2048)
rms = librosa.feature.rms(y=v, frame_length=1024, hop_length=hop)[0]; db = 20*np.log10(rms+1e-9)
n = min(len(f0), len(db)); f0, vf, db = f0[:n], vf[:n], db[:n]
m = librosa.hz_to_midi(f0); t = np.arange(n)*hop/sr
notes = []; cur = None
for i in range(n):
    on = vf[i] and db[i] > -40 and not np.isnan(m[i])
    if on:
        if cur and (abs(m[i] - np.median(m[cur[0]:i][-5:])) > 0.7 or db[i] - db[i-1] > 6):
            notes.append(cur + [i]); cur = None
        if not cur: cur = [i]
    elif cur:
        notes.append(cur + [i]); cur = None
out = []
for a, b in notes:
    if b - a < 5: continue
    out.append(dict(start=round(t[a], 2), end=round(t[b], 2), midi=round(float(np.median(m[a:b])), 1), db=round(float(db[a:b].max()), 1)))
json.dump(out, open('work/notes.json', 'w'), indent=0)
# unvoiced energy onsets (consonants / breathy chants) for completeness
print(len(out), 'notes')
