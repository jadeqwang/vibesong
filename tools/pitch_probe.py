import sys, json, numpy as np, librosa
y, sr = librosa.load('work/demucs/htdemucs_ft/song/vocals.wav', sr=22050, mono=True)
for a, b in json.loads(sys.argv[1]):
    seg = y[int(a*sr):int(b*sr)]
    f0, vf, vp = librosa.pyin(seg, fmin=80, fmax=2000, sr=sr, hop_length=256, frame_length=2048)
    flat = librosa.feature.spectral_flatness(y=seg, hop_length=256)[0]
    cent = librosa.feature.spectral_centroid(y=seg, sr=sr, hop_length=256)[0]
    rms = librosa.feature.rms(y=seg, hop_length=256)[0]
    print(f'--- {a}-{b}')
    for i in range(0, len(f0), 4):
        t = a + i*256/sr
        if rms[min(i,len(rms)-1)] < 0.01: continue
        n = librosa.hz_to_note(f0[i]) if not np.isnan(f0[i]) else '-'
        print(f'  {t:7.2f} f0 {f0[i]:7.1f} {n:>5} vprob {vp[i]:.2f} flat {flat[min(i,len(flat)-1)]:.3f} cent {cent[min(i,len(cent)-1)]:6.0f} rms {rms[min(i,len(rms)-1)]:.3f}')
