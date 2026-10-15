import json, numpy as np, librosa, scipy.signal as ss
E = np.load('work/env5ms.npz'); T5 = np.arange(len(E['mix']))*0.005
inst = 10*np.log10(sum(10**(E[k]/10) for k in ('drums', 'bass', 'other')))
beatline = 10*np.log10(10**(E['drums']/10) + 10**(E['bass']/10))
def runs(mask, mindur):
    out = []; i = 0
    while i < len(mask):
        if mask[i]:
            j = i
            while j < len(mask) and mask[j]: j += 1
            if (j-i)*0.005 >= mindur: out.append((round(i*0.005, 3), round(j*0.005, 3)))
            i = j
        else: i += 1
    return out
facts = {}
facts['full_instrumental_silences'] = [dict(start=a, end=b, dur=round(b-a, 3), mix_min_db=round(float(E['mix'][int(a/0.005):int(b/0.005)].min()), 1),
                                        vocals_db=round(float(np.median(E['vocals'][int(a/0.005):int(b/0.005)])), 1)) for a, b in runs(inst < -45, 0.25)]
facts['beat_dropouts'] = [dict(start=a, end=b, dur=round(b-a, 3)) for a, b in runs(beatline < -45, 0.3)]
# precise re-entry transients after the key silences (first 1 ms sample where drums env crosses -30 dB)
y, sr = librosa.load('work/demucs/htdemucs_ft/song/drums.wav', sr=44100, mono=True)
yb, _ = librosa.load('work/demucs/htdemucs_ft/song/bass.wav', sr=44100, mono=True)
def cross(sig, t0, t1, thr=-30):
    h = 44; e = 20*np.log10(np.sqrt(np.convolve(sig**2, np.ones(h)/h, 'same'))+1e-9)
    a, b = int(t0*sr), int(t1*sr); k = np.where(e[a:b] > thr)[0]
    return round((a+k[0])/sr, 3) if len(k) else None
facts['reentries'] = {
  'drop1_drums': cross(y, 80.7, 81.3), 'drop1_bass808': cross(yb, 80.7, 81.3, -35),
  'final_chorus_drums': cross(y, 138.8, 139.6), 'drop2_drums': cross(y, 174.2, 174.8), 'drop2_bass808': cross(yb, 174.2, 175.0, -35),
  'outro_tag_drums': cross(y, 197.5, 198.3), 'outro_final_hit_drums': cross(y, 197.9, 198.3)}
# whistle / pitched-chop hook segments in the vocal stem (f0 > 900 Hz voiced)
v, sr2 = librosa.load('work/demucs/htdemucs_ft/song/vocals.wav', sr=22050, mono=True)
segs = []
for a, b in ((0, 14), (80, 92), (173, 186), (196, 201.2)):
    f0, vf, vp = librosa.pyin(v[int(a*sr2):int(b*sr2)], fmin=600, fmax=2400, sr=sr2, hop_length=220, frame_length=2048)
    rms = librosa.feature.rms(y=v[int(a*sr2):int(b*sr2)], hop_length=220)[0][:len(f0)]
    m = (~np.isnan(f0)) & (rms > 0.01) & (vp > 0.02)
    for s, e in runs(m, 0.12):
        s2, e2 = a + s*2, a + e*2   # runs() assumes 5 ms frames; here frames are 10 ms
        segs.append(dict(start=round(s2, 2), end=round(e2, 2), median_hz=round(float(np.nanmedian(f0[int(s/0.005):int(e/0.005)])), 0)))
facts['whistle_hook_segments'] = segs
# per-bar energy
g = json.load(open('work/grid_final.json'))['beats']
bars = {}
for o in g:
    bars.setdefault(o['bar'], []).append(o['t'])
bar_rows = []
bl = sorted(bars)
for k, bn in enumerate(bl):
    a = bars[bn][0]; b = bars[bl[k+1]][0] if k+1 < len(bl) else 201.19
    m = (T5 >= a) & (T5 < b)
    pw = lambda key: 10*np.log10(np.mean(10**(E[key][m]/10)))
    bar_rows.append(dict(bar=bn, start=round(a, 3), mix_db=round(float(pw('mix')), 1), drums_db=round(float(pw('drums')), 1), bass_db=round(float(pw('bass')), 1),
                         other_db=round(float(pw('other')), 1), vocals_db=round(float(pw('vocals')), 1)))
facts['bars_energy'] = bar_rows
# strongest mix transients (top 40) with grid position
ym, _ = librosa.load('work/song.wav', sr=44100, mono=True)
om = librosa.onset.onset_strength(y=ym, sr=44100, hop_length=220); tm = np.arange(len(om))*220/44100
rmsm = 20*np.log10(librosa.feature.rms(y=ym, hop_length=220)[0][:len(om)] + 1e-9)
pk = ss.find_peaks(om, distance=40)[0]
score = om[pk] * (1 + np.clip((rmsm[np.minimum(pk+6, len(rmsm)-1)] + 30)/10, 0, 3))
top = pk[np.argsort(score)[::-1][:45]]
gt = np.array([o['t'] for o in g])
hits = []
for k in sorted(top):
    j = np.argmin(np.abs(gt - tm[k])); hits.append(dict(t=round(float(tm[k]), 3), strength=round(float(om[k]/np.median(om)), 1), bar=g[j]['bar'], beat=g[j]['beat'], off_grid_ms=round(1000*float(tm[k]-gt[j]))))
facts['top_transients'] = hits
json.dump(facts, open('work/facts.json', 'w'), indent=1, ensure_ascii=False)
print('SILENCES', json.dumps(facts['full_instrumental_silences']))
print('DROPOUTS', json.dumps(facts['beat_dropouts']))
print('REENTRIES', facts['reentries'])
print('WHISTLE', json.dumps(segs))
print('HITS', ' '.join(f"{h['t']}(b{h['bar']}.{h['beat']},{h['off_grid_ms']:+d})" for h in hits))
