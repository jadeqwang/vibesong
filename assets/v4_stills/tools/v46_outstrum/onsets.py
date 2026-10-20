#!/usr/bin/env python3
"""v46_outstrum: onsets in the outro push window on the demucs stems (other / drums / bass) + the beat grid.
Same measure as v45_scout: 5 ms hop log-RMS flux (positive), peaks above a local threshold.
usage: .venv/bin/python assets/v4_stills/tools/v46_outstrum/onsets.py [t0 t1]"""
import sys, json, numpy as np
from scipy.io import wavfile
from scipy import signal
R = '/home/jade/Documents/vibesong/'
t0, t1 = (float(sys.argv[1]), float(sys.argv[2])) if len(sys.argv) > 2 else (192.5, 197.0)
beats = [b['t'] for b in json.load(open(R + 'analysis/timing.json'))['beat_grid']['beats']]
bw = [b for b in beats if t0 - 0.5 <= b <= t1 + 0.5]
print('beats', [round(b, 3) for b in bw])
print('8ths', [round((a + b) / 2, 3) for a, b in zip(bw, bw[1:])])

def flux(path, band=None):
    sr, x = wavfile.read(path); x = x.astype(np.float32)
    if x.ndim > 1: x = x.mean(1)
    a, b = int((t0 - 0.2) * sr), int((t1 + 0.2) * sr); x = x[a:b]
    if band: x = signal.sosfiltfilt(signal.butter(4, band, 'bandpass', fs=sr, output='sos'), x)
    hop, win = int(0.005 * sr), int(0.020 * sr)
    n = (len(x) - win) // hop
    rms = np.array([np.sqrt(np.mean(x[i * hop:i * hop + win] ** 2)) + 1e-6 for i in range(n)])
    L = 20 * np.log10(rms); f = np.clip(np.diff(L, prepend=L[0]), 0, None)
    tt = t0 - 0.2 + (np.arange(n) * hop + win) / sr       # time at the window's end (onset = where energy arrives)
    return tt, f, L

for name, band in [('other', None), ('other', (300, 3000)), ('drums', None), ('bass', None)]:
    tt, f, L = flux(R + f'work/demucs/htdemucs_ft/song/{name}.wav', band)
    fs = np.convolve(f, np.ones(3) / 3, 'same')
    pk, pr = signal.find_peaks(fs, height=max(1.0, np.percentile(fs, 90)), distance=int(0.09 / 0.005))
    sel = [(round(tt[i], 3), round(fs[i], 1), round(L[min(len(L) - 1, i + 6)], 1)) for i in pk if t0 <= tt[i] <= t1]
    print(f'\n{name} {band or "full"}: (t, flux dB/5ms, level dB +30ms)')
    for s in sel:
        bi = np.interp(s[0], bw, np.arange(len(bw)))
        print('  ', s, ' beat-frac %.2f' % (bi % 1))

# ---- per-8th slot: the strongest flux peak within +-70 ms of each grid 8th (other stem, full band) -> the strum table
tt, f, L = flux(R + 'work/demucs/htdemucs_ft/song/other.wav')
fs = np.convolve(f, np.ones(3) / 3, 'same')
e8 = sorted(bw + [(a + b) / 2 for a, b in zip(bw, bw[1:])])
print('\nper-8th (grid, onset, flux, dt ms):')
for g in e8:
    if not (t0 <= g <= t1): continue
    m = (tt > g - 0.07) & (tt < g + 0.07)
    i = np.argmax(np.where(m, fs, -1)); print('  %.3f  %.3f  %4.1f  %+4.0f' % (g, tt[i], fs[i], (tt[i] - g) * 1000))
