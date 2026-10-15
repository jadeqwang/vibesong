import numpy as np, librosa, scipy.signal as ss
T, O = np.load('work/drum_onset_env.npy'); med = np.median(O)
grid = np.load('work/grid_beats.npy')
# drum onset peaks
pk = ss.find_peaks(O, height=6*med, distance=10)[0]; pt = T[pk]
print('drum-onset density per beat (onsets per beat), 60-82 and 150-175s:')
for lo, hi in ((60, 82), (150, 175)):
    row = []
    for i in range(len(grid)-1):
        if lo <= grid[i] < hi:
            n = ((pt >= grid[i]-0.02) & (pt < grid[i+1]-0.02)).sum(); row.append(f'{grid[i]:.2f}:{n}')
    print(' '.join(row))
# drop impacts: strongest mix onset after the silence
y, sr = librosa.load('work/song.wav', sr=44100, mono=True)
om = librosa.onset.onset_strength(y=y, sr=sr, hop_length=220, lag=1, max_size=1); tm = np.arange(len(om))*220/sr
for a, b in ((80.5, 81.5), (173.8, 174.8), (138.7, 139.8), (197.5, 198.3)):
    m = (tm >= a) & (tm < b); idx = np.where(m)[0]; top = idx[np.argsort(om[idx])[::-1][:3]]
    j = np.argmin(np.abs(grid - tm[top[0]]))
    print(f'window {a}-{b}: top mix onsets ' + ', '.join(f'{tm[k]:.3f}({om[k]/np.median(om):.0f}x)' for k in sorted(top)) + f' | nearest grid beat #{j} {grid[j]:.3f}')
