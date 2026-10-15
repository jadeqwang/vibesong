import glob, os
from PIL import Image, ImageDraw, ImageFont
import hz
C = "/home/jade/Documents/vibesong/keyframes/concepts"
items = [("k01","0:02","cold open"),("k02","0:05","RUN IT"),("k03","0:09","character select"),("k04","0:22","Kaizo run / Eraser"),
         ("k05","0:36","the VOID"),("k06","0:56","fixtures & functions"),("k07","1:22","after THE TURN"),("k08b","1:43","co-op crossing (linked)"),("k08_","1:48","世界是我的舞台"),
         ("k09","1:57","bug dance + paint flood"),("k10","2:05","bridge (PAPER)"),("k11","2:19","perspective lock"),("k12","2:55","drop 2 aerial"),
         ("k13c","2:56","second turn: subdivision"),("k13_","2:57","photoreal aerial"),("k13b","3:00","FIXTURES! pencil view")]
TW, TH, CAP, G = 640, 360, 44, 12
sheet = Image.new("RGB", (4 * TW + 5 * G, 4 * (TH + CAP) + 5 * G), (18, 18, 22))
d = ImageDraw.Draw(sheet)
f = ImageFont.truetype(os.path.join(hz.FONTS, "LXGWWenKai-Medium.ttf"), 26)
for i, (k, t, lab) in enumerate(items):
    p = sorted(glob.glob(f"{C}/{k}*.png" if k.endswith("_") else f"{C}/{k}_*.png"))[0]
    im = Image.open(p).convert("RGB").resize((TW, TH), Image.LANCZOS)
    x = G + (i % 4) * (TW + G); y = G + (i // 4) * (TH + CAP + G)
    sheet.paste(im, (x, y))
    d.text((x + 4, y + TH + 8), f"{k.rstrip('_')}  {t}  ·  {lab}", font=f, fill=(235, 235, 240))
sheet.save(f"{C}/contact_sheet.jpg", quality=90)
print(sheet.size)
