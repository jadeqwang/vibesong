from PIL import Image, ImageDraw, ImageFont
V = "/home/jade/Documents/vibesong/assets/sheets/"
J = "/home/jade/Documents/1-music-shipped/orbital-sunrise-video/media/chars/jade_src/"
import sys
out = sys.argv[1] if len(sys.argv) > 1 else V + "review/jade_v4_v5_brows.jpg"
pairs = [("turnaround front", "paper_jade_turnaround.png", "v5_turn.png", (320, 175, 470, 235)),
         ("turnaround 3/4", "paper_jade_turnaround.png", "v5_turn.png", (940, 175, 1090, 235)),
         ("turnaround side", "paper_jade_turnaround.png", "v5_turn.png", (1560, 190, 1660, 250)),
         ("expression 1", "paper_expr_jade.png", "v5_expr.png", (360, 290, 640, 400)),
         ("expression 2", "paper_expr_jade.png", "v5_expr.png", (1180, 290, 1460, 400)),
         ("expression 3", "paper_expr_jade.png", "v5_expr.png", (2040, 260, 2320, 370)),
         ("expression 4", "paper_expr_jade.png", "v5_expr.png", (230, 1040, 510, 1150)),
         ("expression 5", "paper_expr_jade.png", "v5_expr.png", (1130, 1040, 1410, 1150)),
         ("expression 6", "paper_expr_jade.png", "v5_expr.png", (2040, 1060, 2320, 1170)),
         ("lineup", "paper_lineup.png", "v5_lineup.png", (490, 220, 610, 260))]
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
tr = Image.open(J + "jade_trace_jacket_hp_1.jpg").convert("RGB").crop((500, 800, 1200, 1010)).resize((500, 150))
c = Image.new("RGB", (3 * 510 + 10, len(pairs) * 190 + 50), (250, 246, 236)); d = ImageDraw.Draw(c)
d.text((10, 10), "v4   |   v5   |   trace brows (jade_trace_jacket_hp_1)", font=F, fill=(30, 30, 30))
for i, (lab, a, b, box) in enumerate(pairs):
    y = 50 + i * 190
    A = Image.open(V + "paper/old_v4/" + a).convert("RGB").crop(box); B = Image.open(V + "raw/" + b).convert("RGB").crop(box)
    h = int(500 * (box[3] - box[1]) / (box[2] - box[0]))
    A = A.resize((500, h), Image.LANCZOS).crop((0, 0, 500, min(h, 160))); B = B.resize((500, h), Image.LANCZOS).crop((0, 0, 500, min(h, 160)))
    c.paste(A, (10, y + 22)); c.paste(B, (520, y + 22)); c.paste(tr, (1030, y + 22)); d.text((10, y), lab, font=F, fill=(80, 80, 80))
c.save(out, quality=90); print(c.size)
