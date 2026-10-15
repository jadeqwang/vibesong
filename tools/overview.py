import numpy as np, soundfile as sf
st={}
for n in ['vocals','drums','bass','other']:
    y,sr=sf.read(f'work/demucs/htdemucs_ft/song/{n}.wav'); y=y.mean(1); st[n]=y
y,sr=sf.read('work/song.wav'); st['mix']=y.mean(1)
L=len(st['mix'])//sr
def db(x): return 20*np.log10(np.sqrt(np.mean(x**2))+1e-9)
print('  t   mix  voc  drm  bas  oth')
step=0.5
for i in range(int(L/step)+1):
    a=int(i*step*sr); b=int((i+1)*step*sr)
    print(f"{i*step:6.1f} "+" ".join(f"{db(st[k][a:b]):5.0f}" for k in ['mix','vocals','drums','bass','other']))
