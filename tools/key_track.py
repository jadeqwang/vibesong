import numpy as np, librosa, soundfile as sf
sr = 22050
ys = [librosa.load(f'work/demucs/htdemucs_ft/song/{s}.wav', sr=sr, mono=True)[0] for s in ('other', 'bass', 'vocals')]
n = min(len(y) for y in ys); harm = sum(y[:n] for y in ys)
C = librosa.feature.chroma_cqt(y=harm, sr=sr, hop_length=512, bins_per_octave=36)
fps = sr/512
maj = np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88]); mnr = np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])
names = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B']
def key(v):
    best = []
    for i in range(12):
        best.append((np.corrcoef(v, np.roll(maj, i))[0,1], names[i]+' maj'))
        best.append((np.corrcoef(v, np.roll(mnr, i))[0,1], names[i]+' min'))
    best.sort(reverse=True); return best[:2]
import sys
wins = [(0,13),(13,33.5),(33.5,41),(41,66),(66,80),(81,92),(92,110),(110,122.2),(122.2,136),(136,160),(160,173.4),(174,184),(184,194),(194,201)]
for a,b in wins:
    v = C[:, int(a*fps):int(b*fps)].mean(1); k = key(v)
    print(f'{a:6.1f}-{b:6.1f}  {k[0][1]:7s} r={k[0][0]:.2f}   2nd {k[1][1]:7s} r={k[1][0]:.2f}   top pcs: {[names[i] for i in np.argsort(v)[::-1][:5]]}')
# sliding 6 s window for a finer look
print()
for a in np.arange(100, 150, 2.0):
    v = C[:, int(a*fps):int((a+6)*fps)].mean(1); k = key(v); print(f'{a:6.1f}  {k[0][1]:7s} {k[0][0]:.2f} | {k[1][1]:7s}  pcs {[names[i] for i in np.argsort(v)[::-1][:4]]}')
