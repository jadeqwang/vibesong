import sys
from PIL import Image, ImageDraw, ImageFont
V = "/home/jade/Documents/vibesong/assets/sheets/"
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20); FS = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 17)
v4 = {"turn": "paper/old_v4/paper_jade_turnaround.png", "expr": "paper/old_v4/paper_expr_jade.png", "lineup": "paper/old_v4/paper_lineup.png"}
v3 = {"turn": "paper/old_v3/paper_jade_turnaround.png", "expr": "paper/old_v3/paper_expr_jade.png", "lineup": "paper/old_v3/paper_lineup.png"}
rows = [("FRONT full face", "turn", (250, 110, 530, 380)), ("turnaround front", "turn", (300, 165, 500, 245)), ("turnaround 3/4", "turn", (925, 165, 1105, 245)),
        ("expr 1 neutral", "expr", (330, 250, 700, 410)), ("expr 2 smile", "expr", (1150, 250, 1520, 410)), ("expr 3 sing soft", "expr", (1990, 230, 2360, 390)),
        ("expr 4 sing loud", "expr", (180, 1010, 560, 1170)), ("expr 5 laugh", "expr", (1090, 1010, 1470, 1170)), ("expr 6 determined", "expr", (1990, 1030, 2370, 1190)),
        ("lineup", "lineup", (450, 170, 660, 280))]
CW = 560; out = OUT if "OUT" in globals() else (sys.argv[1] if len(sys.argv) > 1 else V + "review/jade_v8_brows.jpg")
blocks = []
for lab, k, box in rows:
    cols_ = COLS if "COLS" in globals() else ("v3", "v8", "v8b")
    ims = [Image.open(V + (v3[k] if c == "v3" else v4[k] if c == "v4" else f"v6/{k}_{c}.png")).convert("RGB").crop(box) for c in cols_]
    h = int(CW * (box[3] - box[1]) / (box[2] - box[0])); ims = [i.resize((CW, h), Image.LANCZOS) for i in ims]
    blocks.append((lab, ims, h))
H = 60 + sum(b[2] + 34 for b in blocks) + 70
c = Image.new("RGB", (3 * (CW + 10) + 10, H), (250, 246, 236)); d = ImageDraw.Draw(c)
for j, t in enumerate(HEAD if "HEAD" in globals() else ["v3 (start)", "v8: 2x, grown upward (gap kept)", "v8b: 2x, grown both ways"]): d.text((10 + j * (CW + 10), 15), t, font=F, fill=(30, 30, 30))
y = 50
for lab, ims, h in blocks:
    d.text((10, y), lab, font=FS, fill=(80, 80, 80))
    for j, im in enumerate(ims): c.paste(im, (10 + j * (CW + 10), y + 20))
    y += h + 34
c.save(out, quality=90); print(c.size)
