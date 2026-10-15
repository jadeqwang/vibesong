"""Build the variable-tempo 140-level beat grid: beat_this pulses + midpoints, snapped to drum onsets, smoothed with a spline."""
import json, numpy as np
from scipy.interpolate import UnivariateSpline
bt = json.load(open('work/beatthis.json')); b = np.array(bt['beats'])
T, O = np.load('work/drum_onset_env.npy')
med = np.median(O)
def snap(t, w=0.05):
    m = (T > t-w) & (T < t+w); i = np.argmax(O[m]); return T[m][i], O[m][i]
reg = b[b < 177.5]
full = np.sort(np.concatenate([reg, (reg[:-1]+reg[1:])/2]))
sn = np.array([snap(t) for t in full]); strong = sn[:,1] > 4*med
idx = np.arange(len(full))
sp = UnivariateSpline(idx[strong], sn[strong,0], k=3, s=strong.sum()*0.004**2)
grid = sp(idx)
r = sn[strong,0]-grid[strong]
print('anchor residual rms %.1f ms, max %.1f ms, p95 %.1f ms' % (r.std()*1000, np.abs(r).max()*1000, np.percentile(np.abs(r),95)*1000))
# tail: extend with local period trend from last 64 beats
per = np.diff(grid)
c = np.polyfit(idx[-64:-1], per[-63:], 1)
tail = [grid[-1]]; k = len(grid)-1
while tail[-1] < 201.2:
    tail.append(tail[-1] + np.polyval(c, k)); k += 1
allb = np.concatenate([grid, tail[1:]])
print('last regular beat %.3f, period then %.4f (%.2f bpm); tail period end %.4f' % (grid[-1], per[-1], 60/per[-1], np.polyval(c,k)))
# check tail onsets: strongest drum onsets after 174
pk = [(T[i], O[i]) for i in range(1, len(O)-1) if T[i] > 173.5 and O[i] > 12*med and O[i] >= O[i-1] and O[i] >= O[i+1]]
for t, o in pk:
    j = np.argmin(np.abs(allb-t)); print(f'onset {t:7.3f} str {o/med:5.1f}x  nearest beat #{j} {allb[j]:7.3f} dev {1000*(t-allb[j]):6.1f} ms')
np.save('work/grid_beats.npy', allb)
