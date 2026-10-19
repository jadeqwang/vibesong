import sys
from PIL import Image
W=(250,243,232,255); K=(2,1,2,255); LID=(100,94,97,255)
FRAC=float(sys.argv[2]) if len(sys.argv)>2 else 0.5
def comps(px,w,h):
  seen=set(); out=[]
  for y in range(h):
    for x in range(w):
      if px[x,y]==W and (x,y) not in seen:
        st=[(x,y)]; seen.add((x,y)); pts=[]
        while st:
          a,b=st.pop(); pts.append((a,b))
          for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
            q=(a+dx,b+dy)
            if 0<=q[0]<w and 0<=q[1]<h and q not in seen and px[q]==W: seen.add(q); st.append(q)
        out.append(pts)
  return out
def lid(src,dst,n):
  im=Image.open(src).convert('RGBA'); px=im.load()
  for i in range(n):
    x0=i*132
    f=im.crop((x0,0,x0+132,124)); fp=f.load()
    eyes=[c for c in comps(fp,132,124) if len(c)>=90 and min(p[1] for p in c)>40 and max(p[1] for p in c)<95]
    for c in eyes:
      ys=[p[1] for p in c]; top,bot=min(ys),max(ys)
      cut=top+round((bot-top+1)*FRAC)
      # row spans of the eye (white + enclosed pupil)
      for y in range(top,cut+2):
        xs=[p[0] for p in c if p[1]==y]
        if not xs: continue
        for x in range(min(xs),max(xs)+1):
          col = LID if y<cut else K   # lid skin above, 2-px black lid line at the cut
          px[x0+x,y]=col
  im.save(dst)
lid(f'{sys.argv[1]}/eraser_skid_x2.png',f'{sys.argv[3]}/eraser_skid_x2.png',3)
lid(f'{sys.argv[1]}/eraser_peer_x2.png',f'{sys.argv[3]}/eraser_peer_x2.png',1)
