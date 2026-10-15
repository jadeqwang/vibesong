import json, numpy as np, librosa, scipy.signal as ss
y, sr = librosa.load('work/demucs/htdemucs_ft/song/drums.wav', sr=44100, mono=True)
def band_env(lo, hi):
    sos = ss.butter(4, [lo, hi], btype='band', fs=sr, output='sos'); z = ss.sosfilt(sos, y)
    h = 220; e = np.sqrt(np.convolve(z**2, np.ones(h)/h, mode='same'))[::h]; return e
K = band_env(30, 120); S = band_env(1500, 6000)
bt = json.load(open('work/beatthis.json')); b = np.array(bt['beats']); db = np.array(bt['downbeats'])
def at(e, t): i = int(t/0.005); return e[i:i+16].max()
print('pulse   K      S    downbeat?')
for t in b[:24]:
    print(f'{t:6.2f} {at(K,t):.4f} {at(S,t):.4f} {"DB" if np.min(np.abs(db-t))<0.01 else ""}')
# statistics over the whole regular region by pulse position within beat_this bar
pos = []
for t in b[b<177]:
    k = np.searchsorted(db, t+0.01)-1; p = int(round((t-db[k])/ ((db[k+1]-db[k])/4))) if k+1 < len(db) else -1
    pos.append((p, at(K,t), at(S,t)))
pos = np.array(pos)
for p in range(4):
    m = pos[:,0]==p; print('pos',p,'kick mean %.4f snare mean %.4f n=%d'%(pos[m,1].mean(), pos[m,2].mean(), m.sum()))
