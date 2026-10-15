import numpy as np, librosa, json
y, sr = librosa.load('work/demucs/htdemucs_ft/song/drums.wav', sr=22050, mono=True)
hop=256
oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
fps=sr/hop
# windowed autocorrelation tempo estimate, high resolution (search 125-165 BPM)
win=int(8*fps); step=int(2*fps)
bpms=np.arange(120,170,0.1)
for s in range(0,len(oenv)-win,step):
    seg=oenv[s:s+win]-oenv[s:s+win].mean()
    # comb score: sum over lags of k beats
    best=None
    sc=[]
    for bpm in bpms:
        p=60/bpm*fps
        v=0
        for k in (1,2,4):
            L=p*k; i=int(L); f=L-i
            if i+1>=win: continue
            a=np.dot(seg[:-i-1],(1-f)*seg[i:-1]+f*seg[i+1:])
            v+=a
        sc.append(v)
    sc=np.array(sc)
    print(f"{s/fps:6.1f}s  bpm={bpms[sc.argmax()]:.1f}  strength={oenv[s:s+win].mean():.2f}")
