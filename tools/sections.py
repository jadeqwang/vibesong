import json, numpy as np
SECTIONS = [  # name, start, end, first bar, last bar (bar lines from grid; drop starts at measured impact)
 ('Intro A', 0.0, 7.183, 1, 4), ('Intro B', 7.183, 14.012, 5, 8), ('Verse 1', 14.012, 34.298, 9, 20), ('Pre-Chorus', 34.298, 41.028, 21, 24),
 ('Chorus 1', 41.028, 67.778, 25, 40), ('Chorus 1 tag / build (snare roll -> silence)', 67.778, 80.81, 41, 48), ('Post-Chorus Drop 1', 80.81, 94.204, 49, 56),
 ('Verse 2', 94.204, 110.450, 57, 66), ('Rap Verse', 110.450, 123.354, 67, 74), ('Bridge (stripped, half-time)', 123.354, 136.212, 75, 82),
 ('Final Chorus', 136.212, 161.728, 83, 98), ('Final Chorus tag / build (roll -> silence)', 161.728, 174.395, 99, 106), ('Post-Chorus Drop 2', 174.395, 187.039, 107, 114),
 ('Outro', 187.039, 201.19, 115, 122)]
E = np.load('work/env5ms.npz'); T = np.arange(len(E['mix']))*0.005
T_, O = np.load('work/drum_onset_env.npy')
def pw(key, a, b):
    m = (T >= a) & (T < b); return float(10*np.log10(np.mean(10**(E[key][m]/10))))
rows = []
for n, a, b, b0, b1 in SECTIONS:
    r = dict(name=n, start=a, end=b, mix=pw('mix', a, b), drums=pw('drums', a, b), bass=pw('bass', a, b), other=pw('other', a, b), vocals=pw('vocals', a, b))
    m = (T_ >= a) & (T_ < b); r['onset_rate'] = float((O[m] > 6*np.median(O)).sum()/(b-a))
    rows.append(r); print(f"{n:45s} {a:7.2f}-{b:7.2f} mix {r['mix']:6.1f} drm {r['drums']:6.1f} bas {r['bass']:6.1f} oth {r['other']:6.1f} voc {r['vocals']:6.1f} onsets/s {r['onset_rate']:.1f}")
json.dump(rows, open('work/section_stats.json', 'w'), indent=1)
