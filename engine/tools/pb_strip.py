import sys
from PIL import Image, ImageDraw
out=sys.argv[1]; fs=sys.argv[2:]
w=480; ims=[Image.open(f).convert('RGB') for f in fs]; h=int(ims[0].height*w/ims[0].width)
cols=min(len(ims),6); rows=(len(ims)+cols-1)//cols
S=Image.new('RGB',(cols*w,rows*(h+16)),(20,20,20)); D=ImageDraw.Draw(S)
for i,(f,im) in enumerate(zip(fs,ims)):
    x=(i%cols)*w; y=(i//cols)*(h+16); S.paste(im.resize((w,h),Image.LANCZOS),(x,y+16)); D.text((x+3,y+2),f.split('/')[-1],fill=(255,255,0))
S.save(out)
