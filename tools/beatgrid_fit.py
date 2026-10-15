import json, numpy as np, librosa
bt = json.load(open('work/beatthis.json'))
b = np.array(bt['beats']); db = np.array(bt['downbeats'])
# drum onset envelope, fine resolution
y, sr = librosa.load('work/demucs/htdemucs_ft/song/drums.wav', sr=44100, mono=True)
hop = 220  # 5 ms
oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop, lag=1, max_size=1)
times = librosa.frames_to_time(np.arange(len(oenv)), sr=sr, hop_length=hop)
np.save('work/drum_onset_env.npy', np.stack([times, oenv]))
# regular region of beat_this half-time pulses
reg = b[b < 177.0]
n = np.arange(len(reg))
ib = np.diff(reg)
print('half-pulse intervals first/last', ib[:5], ib[-5:])
for deg in (1, 2, 3, 4):
    c = np.polyfit(n, reg, deg); r = reg - np.polyval(c, n)
    print(f'deg {deg}: resid rms {r.std()*1000:.1f} ms  max {np.abs(r).max()*1000:.1f} ms')
