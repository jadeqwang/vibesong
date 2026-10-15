"""Score stable-ts vs CTC word starts against syllable onsets detected in the vocal stem (energy flux + pitch changes)."""
import json, numpy as np, librosa
sr = 22050; hop = 110  # 5 ms
v = librosa.load('work/demucs/htdemucs_ft/song/vocals.wav', sr=sr, mono=True)[0]
o = librosa.onset.onset_strength(y=v, sr=sr, hop_length=hop, lag=2)
eon = librosa.onset.onset_detect(onset_envelope=o, sr=sr, hop_length=hop, units='time', delta=0.04, wait=16)
f0, vf, vp = librosa.pyin(v, fmin=110, fmax=1000, sr=sr, hop_length=hop*4, frame_length=2048)
midi = librosa.hz_to_midi(f0); tt = np.arange(len(midi))*hop*4/sr
pon = []
for i in range(4, len(midi)):
    if vf[i] and (not vf[i-1] or (not np.isnan(midi[i-4]) and abs(np.nanmedian(midi[i:i+3]) - np.nanmedian(midi[i-4:i-1])) > 0.8)):
        if not pon or tt[i]-pon[-1] > 0.08: pon.append(tt[i])
ons = np.sort(np.concatenate([eon, np.array(pon)]))
np.save('work/syllable_onsets.npy', ons)
S = {d['id']: d for d in json.load(open('work/aligned_refined.json'))}
C = {d['id']: d for d in json.load(open('work/ctc_align.json'))}
def dist(t): return float(np.min(np.abs(ons - t)))
rows = []
for i in S:
    sw = [w['start'] for w in S[i]['words']]; cw = [w['start'] for w in C[i]['words']]
    ds = np.mean([dist(t) for t in sw]); dc = np.mean([dist(t) for t in cw])
    # random baseline: onsets density
    a, b = S[i]['win']; dens = ((ons > a) & (ons < b)).sum()/(b-a)
    rows.append((i, ds, dc, dens))
    print(f"{i:3d} {S[i]['text'][:30]:30s} stable-ts mean|Δonset| {ds*1000:5.0f} ms   CTC {dc*1000:5.0f} ms   onsets/s {dens:4.1f}   line start S {sw[0]:7.2f} C {cw[0]:7.2f}")
r = np.array(rows); print('overall: stable-ts %.0f ms, CTC %.0f ms' % (r[:,1].mean()*1000, r[:,2].mean()*1000))
