"""Final beat grid -> work/grid_final.json
Zone A (0.34-187.06 s): beat_this half-time pulses + midpoints, snapped to drum-stem onsets, cubic smoothing spline
  (accelerando ~140.4 -> ~152 BPM). Tail anchors 174-187.06 s added from snapped drum onsets.
Zone B (187.06-194.06 s): no percussive pulse (rubato pad + free vocal) -> 16 evenly spaced NOMINAL beats (4 bars).
Zone C (194.06-197.62 s): synth pulse ~134 BPM, beats from 'other'/mix onsets (interpolated where silent).
Zone D (197.62-end): final tag ~141 BPM from drum onsets."""
import json, numpy as np
from scipy.interpolate import UnivariateSpline
bt = json.load(open('work/beatthis.json')); b = np.array(bt['beats'])
T, O = np.load('work/drum_onset_env.npy'); med = np.median(O)
def snap(t, w=0.045):
    m = (T > t-w) & (T < t+w); i = np.argmax(O[m]); return T[m][i], O[m][i]
reg = b[b < 177.5]
full = list(np.sort(np.concatenate([reg, (reg[:-1]+reg[1:])/2])))
# extend through 187.06 using previous fit
old = np.load('work/grid_beats.npy')
full += [x for x in old if full[-1] + 0.2 < x <= 187.1]
full = np.array(full); idx = np.arange(len(full))
sn = np.array([snap(t) for t in full]); strong = (sn[:,1] > 4*med) & (np.abs(sn[:,0]-full) < 0.03)
sp = UnivariateSpline(idx[strong], sn[strong,0], k=3, s=strong.sum()*0.004**2)
A = sp(idx)
r = sn[strong,0] - A[strong]
stats = dict(anchors=int(strong.sum()), beats=int(len(A)), resid_rms_ms=round(float(r.std()*1000), 1),
             resid_p95_ms=round(float(np.percentile(np.abs(r), 95)*1000), 1), resid_max_ms=round(float(np.abs(r).max()*1000), 1))
print('zone A', stats, 'last beat', A[-1])
lastA = A[-1]                       # should be ~187.06 (bar line)
B = np.linspace(lastA, 194.06, 17)[1:-1]   # 15 interior nominal beats; 194.06 starts zone C
C = np.array([194.06, 194.52, 194.955, 195.395, 195.855, 196.305, 196.76, 197.19])
D0 = 197.62; per = (199.322 - 198.045)/3
D = np.array([D0] + list(198.045 + per*np.arange(0, 7)))
D = D[D < 201.0]
beats = [(t, 'measured') for t in A] + [(t, 'nominal_rubato') for t in B] + [(t, 'measured_outro') for t in C] + [(t, 'measured_outro') for t in D]
out = []
for i, (t, z) in enumerate(beats):
    out.append(dict(i=i, t=round(float(t), 3), bar=i//4 + 1, beat=i % 4 + 1, zone=z))
# local bpm
ts = np.array([o['t'] for o in out])
for i, o in enumerate(out):
    if i+1 < len(ts): o['bpm'] = round(60/(ts[i+1]-ts[i]), 1)
    else: o['bpm'] = out[i-1]['bpm']
json.dump(dict(beats=out, fit=stats), open('work/grid_final.json', 'w'), indent=0)
print('total beats', len(out), 'bars', out[-1]['bar'], 'zoneB first/last', B[0], B[-1], 'bar of 187.06:', [o for o in out if abs(o['t']-lastA) < 1e-3][0])
print('bar starts at key times:', [(o['bar'], o['t']) for o in out if o['beat'] == 1 and o['bar'] in (1,5,9,21,25,41,49,57,67,75,83,85,99,107,115,119,121,122)])
print('bpm samples:', [(o['t'], o['bpm']) for o in out[::40]])
