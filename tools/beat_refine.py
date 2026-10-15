import json, numpy as np
bt = json.load(open('work/beatthis.json')); b = np.array(bt['beats'])
T, O = np.load('work/drum_onset_env.npy')
def snap(t, w=0.05):
    m = (T > t-w) & (T < t+w)
    if not m.any(): return t, 0
    i = np.argmax(O[m]); return T[m][i], O[m][i]
reg = b[b < 177.5]
# 140-level beats = pulses + midpoints
full = np.sort(np.concatenate([reg, (reg[:-1]+reg[1:])/2]))
sn = np.array([snap(t) for t in full])
med = np.median(O)
strong = sn[:,1] > 4*med
print('beats', len(full), 'with strong onset within ±50ms:', strong.sum())
ts = sn[:,0]
off = (ts-full)*1000
print('offset ms (snapped-beat_this) median %.1f, std %.1f' % (np.median(off[strong]), off[strong].std()))
# local tempo from snapped strong beats, by 16-beat windows
idx = np.arange(len(full))
for s in range(0, len(full)-16, 16):
    m = strong[s:s+16]
    if m.sum() < 6: print(f'{full[s]:7.2f} few onsets'); continue
    c = np.polyfit(idx[s:s+16][m], ts[s:s+16][m], 1)
    r = ts[s:s+16][m] - np.polyval(c, idx[s:s+16][m])
    print(f'{full[s]:7.2f}s  bpm {60/c[0]:6.2f}  fit resid {r.std()*1000:5.1f} ms  n={m.sum()}')
