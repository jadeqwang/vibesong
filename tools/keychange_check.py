import json, numpy as np, librosa
sr = 22050
v = librosa.load('work/demucs/htdemucs_ft/song/vocals.wav', sr=sr, mono=True)[0]
al = {d['id']: d for d in json.load(open('work/aligned_raw.json'))}
def med_pitch(a, b):
    f0, vf, vp = librosa.pyin(v[int(a*sr):int(b*sr)], fmin=100, fmax=900, sr=sr, hop_length=256)
    f = f0[(vp > 0.5) & ~np.isnan(f0)]
    return np.median(librosa.hz_to_midi(f)) if len(f) > 5 else np.nan, librosa.hz_to_midi(f)
pairs = [(9, 29), (10, 30), (11, 31), (12, 32), (2, 17), (2, 37), (4, 19), (13, 33), (14, 34)]
for a, b in pairs:
    A, B = al[a], al[b]
    ma, pa = med_pitch(A['words'][0]['start'], A['words'][-1]['end'])
    mb, pb = med_pitch(B['words'][0]['start'], B['words'][-1]['end'])
    # histogram cross-correlation in semitones
    ha = np.histogram(pa % 12, bins=48, range=(0, 12))[0].astype(float); hb = np.histogram(pb % 12, bins=48, range=(0, 12))[0].astype(float)
    xc = [np.dot(ha, np.roll(hb, -k)) for k in range(48)]; sh = np.argmax(xc) / 4
    print(f'line {a:2d} vs {b:2d} ({A["text"][:30]:30s}) median midi {ma:6.2f} vs {mb:6.2f} diff {mb-ma:+5.2f} st; pitch-class shift {sh if sh<=6 else sh-12:+.2f} st')
# chroma shift between whole choruses (harmonic stems)
ys = [librosa.load(f'work/demucs/htdemucs_ft/song/{s}.wav', sr=sr, mono=True)[0] for s in ('other', 'bass')]
h = ys[0] + ys[1]
C = librosa.feature.chroma_cqt(y=h, sr=sr, hop_length=512)
fps = sr/512
def chroma(a, b): return C[:, int(a*fps):int(b*fps)].mean(1)
for (a1, b1), (a2, b2), lab in [((41, 66), (136, 161), 'chorus1 vs final chorus'), ((81, 92), (174, 184), 'drop1 vs drop2'), ((66, 80), (160, 173.4), 'build1 vs build2'), ((13, 33), (92, 110), 'verse1 vs verse2')]:
    c1, c2 = chroma(a1, b1), chroma(a2, b2)
    sc = [np.corrcoef(c1, np.roll(c2, -k))[0, 1] for k in range(12)]
    print(f'{lab}: best shift {np.argmax(sc)} st (r={max(sc):.3f}); r at 0 = {sc[0]:.3f}, r at +1 = {sc[1]:.3f}, +2 = {sc[2]:.3f}')
