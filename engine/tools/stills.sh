#!/bin/bash
# usage: tools/stills.sh <outdir> <res> t1 t2 ...   -> renders stills + a labelled contact sheet <outdir>/sheet.png
OUT=$1; RES=$2; shift 2; mkdir -p $OUT; rm -f $OUT/s_*.png
L=""; for t in "$@"; do L="$L,$t:$OUT/s_$(printf '%07.3f' $t).png"; done
node "$(dirname $0)/../render.js" --show ${SHOW:-main} --res $RES --stills ${L:1} 2>&1 | grep -v "GPU stall\|GL Driver\|CONTEXT_LOST\|404" | tail -${TAILN:-4}
/home/jade/Documents/vibesong/.venv/bin/python - "$OUT" <<'PY'
import sys,glob,os
from PIL import Image, ImageDraw
d=sys.argv[1]; fs=sorted(glob.glob(d+'/s_*.png'))
if not fs: sys.exit()
im0=Image.open(fs[0]); w=480; h=int(im0.height*w/im0.width); cols=3; rows=(len(fs)+cols-1)//cols
S=Image.new('RGB',(cols*w,rows*(h+14)),(20,20,20)); D=ImageDraw.Draw(S)
for i,f in enumerate(fs):
    x=(i%cols)*w; y=(i//cols)*(h+14); S.paste(Image.open(f).convert('RGB').resize((w,h),Image.LANCZOS),(x,y+14)); D.text((x+3,y+1),os.path.basename(f)[2:-4]+'s',fill=(255,255,0))
S.save(d+'/sheet.png')
PY
