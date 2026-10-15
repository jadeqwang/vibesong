import numpy as np, soundfile as sf
def env(path, hop=0.005, win=0.02):
    y,sr=sf.read(path); y=y.mean(1) if y.ndim>1 else y
    h=int(hop*sr); w=int(win*sr)
    n=(len(y)-w)//h
    e=np.array([np.sqrt(np.mean(y[i*h:i*h+w]**2)) for i in range(n)])
    return 20*np.log10(e+1e-9)
mix=env('work/song.wav')
ins={k:env(f'work/demucs/htdemucs_ft/song/{k}.wav') for k in ['drums','bass','other','vocals']}
np.savez('work/env5ms.npz', mix=mix, **ins)
# instrumental = drums+bass+other energy (sum power)
inst=10*np.log10(sum(10**(ins[k]/10) for k in ['drums','bass','other']))
np.save('work/inst5ms.npy', inst)
# find runs where instrumental is < -45 dB for >=60ms
thr=-45
low=inst<thr
runs=[];i=0
while i<len(low):
    if low[i]:
        j=i
        while j<len(low) and low[j]: j+=1
        if (j-i)*0.005>=0.06: runs.append((i*0.005,j*0.005))
        i=j
    else: i+=1
for a,b in runs:
    ia,ib=int(a/0.005),int(b/0.005)
    print(f"inst<-45dB  {a:8.3f}-{b:8.3f} ({b-a:.3f}s)  mix min {mix[ia:ib].min():.0f} dB  vocals mean {ins['vocals'][ia:ib].mean():.0f} dB  next inst peak {inst[ib:ib+40].max():.0f} @ {(ib+inst[ib:ib+40].argmax())*0.005:.3f}")
