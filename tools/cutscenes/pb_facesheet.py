"""v4.3 spread reshoot: face / eye-band review sheets for the outro living layer (all three characters, tracked).
    $OSPY tools/cutscenes/pb_facesheet.py SRC OUT.jpg [--fps=6] [--scale=3] [--cols=2] [--who=CJR] [--eyes] [--start=I --end=I]
SRC = frame dir (1080 f_*.jpg @30 fps) or an mp4 (sampled at --fps). Faces are tracked by NCC template match, starting from the
v11 still layout (C = Charlie, J = Jade, R = Ricky); --eyes crops each face to its eye band."""
import sys, os, glob, subprocess, tempfile, shutil, cv2, numpy as np
a=[x for x in sys.argv[1:] if not x.startswith('--')]; o=dict((x[2:].split('=')+[True])[:2] for x in sys.argv[1:] if x.startswith('--'))
src,out=a; sc=float(o.get('scale',3)); who=o.get('who','CJR'); cols=int(o.get('cols',2)); fps=float(o.get('fps',6))
BOX={'C':(600,250,750,385),'J':(955,265,1105,425),'R':(1320,245,1470,380)}
EYE={'C':(0,40,150,100),'J':(0,40,150,110),'R':(0,30,150,95)}
FF="/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
td=None
if os.path.isdir(src):
    files=sorted(glob.glob(src+'/f_*.jpg')); stp=max(1,round(30/fps)); s=int(o.get('start',0)); e=int(o.get('end',len(files)))
    idx=list(range(s,e,stp)); lab=[f'f{i}' for i in idx]; files=[files[i] for i in idx]
else:
    td=tempfile.mkdtemp(dir=os.environ.get('TMPDIR')); subprocess.run([FF,'-v','error','-i',src,'-vf',f'fps={fps},scale=1920:1080','-q:v','2',td+'/f_%05d.jpg'],check=True)
    files=sorted(glob.glob(td+'/f_*.jpg')); lab=[f'{i/fps:.2f}s' for i in range(len(files))]
pos={k:np.array(BOX[k][:2],float) for k in who}; tmpl={}; tiles=[]
for n,f in enumerate(files):
    im=cv2.imread(f); g=cv2.cvtColor(im,cv2.COLOR_BGR2GRAY); row=[]
    for k in who:
        w=BOX[k][2]-BOX[k][0]; h=BOX[k][3]-BOX[k][1]
        if k in tmpl:
            x0,y0=pos[k].astype(int); R=50; sx0,sy0=max(0,x0-R),max(0,y0-R); win=g[sy0:y0+h+R, sx0:x0+w+R]
            _,_,_,mx=cv2.minMaxLoc(cv2.matchTemplate(win,tmpl[k],cv2.TM_CCOEFF_NORMED)); pos[k]=np.array([sx0+mx[0],sy0+mx[1]],float)
        x0,y0=pos[k].astype(int); tmpl[k]=g[y0:y0+h,x0:x0+w].copy(); c=im[y0:y0+h,x0:x0+w]
        if o.get('eyes'): e=EYE[k]; c=c[e[1]:e[3],e[0]:e[2]]
        row.append(cv2.resize(c,None,fx=sc,fy=sc,interpolation=cv2.INTER_LANCZOS4))
    H=max(r.shape[0] for r in row); t=np.full((H,sum(r.shape[1] for r in row)+6*(len(row)-1),3),255,np.uint8); x=0
    for r in row: t[:r.shape[0],x:x+r.shape[1]]=r; x+=r.shape[1]+6
    cv2.putText(t,lab[n],(4,22),cv2.FONT_HERSHEY_SIMPLEX,0.7,(0,0,255),2); tiles.append(t)
th,tw=tiles[0].shape[:2]; rows=(len(tiles)+cols-1)//cols
S=np.zeros((rows*(th+6),cols*(tw+10),3),np.uint8)
for n,t in enumerate(tiles): S[(n//cols)*(th+6):(n//cols)*(th+6)+th,(n%cols)*(tw+10):(n%cols)*(tw+10)+tw]=t
cv2.imwrite(out,S,[cv2.IMWRITE_JPEG_QUALITY,88]); print(out,S.shape,len(tiles))
if td: shutil.rmtree(td)
