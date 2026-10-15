from PIL import Image, ImageDraw, ImageFont
V = "/home/jade/Documents/vibesong/assets/sheets/"
J = "/home/jade/Documents/1-music-shipped/orbital-sunrise-video/media/chars/jade_src/jade_trace_jacket_hp_1.jpg"
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20); FS = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 17)
src = {"turn": "paper/paper_jade_turnaround.png", "expr": "paper/paper_expr_jade.png", "lineup": "paper/paper_lineup.png"}
rows = [("FRONT full face", "turn", (250, 110, 530, 380), J, (330, 430, 1230, 1500)),
        ("turnaround front", "turn", (300, 165, 500, 245), J, (480, 780, 1220, 1080)),
        ("turnaround 3/4", "turn", (925, 165, 1105, 245), J, (480, 780, 1220, 1080)),
        ("expr 1 neutral", "expr", (330, 250, 700, 410), J, (480, 780, 1220, 1080)),
        ("expr 2 smile", "expr", (1150, 250, 1520, 410), J, (480, 780, 1220, 1080)),
        ("expr 3 sing soft (B: fitted to v5 brow)", "expr", (1990, 230, 2360, 390), J, (480, 780, 1220, 1080)),
        ("expr 4 sing loud (B: fitted)", "expr", (180, 1010, 560, 1170), J, (480, 780, 1220, 1080)),
        ("expr 5 laugh (B: fitted)", "expr", (1090, 1010, 1470, 1170), J, (480, 780, 1220, 1080)),
        ("expr 6 determined (B: fitted)", "expr", (1990, 1030, 2370, 1190), J, (480, 780, 1220, 1080)),
        ("lineup", "lineup", (470, 195, 640, 275), J, (480, 780, 1220, 1080))]
CW = 440
blocks = []
for lab, k, box, tp, tbox in rows:
    cols = COLS if "COLS" in globals() else None
    ims = [Image.open(V + (src[k] if c == "v5" else f"v6/{k}_{c}.png")).convert("RGB").crop(box) for c in (cols or ["v5", "v6A", "v6B"])] + [Image.open(tp).convert("RGB").crop(tbox)]
    h = int(CW * (box[3] - box[1]) / (box[2] - box[0]))
    ims = [i.resize((CW, h if j < 3 else int(CW * i.height / i.width)), Image.LANCZOS) for j, i in enumerate(ims)]
    blocks.append((lab, ims, max(i.height for i in ims)))
H = 90 + sum(b[2] + 40 for b in blocks) + 130
c = Image.new("RGB", (4 * (CW + 10) + 10, H), (250, 246, 236)); d = ImageDraw.Draw(c)
for j, t in enumerate(HEAD if "HEAD" in globals() else ["v5 (current)", "v6A: trim + hair-tone", "v6B: trace brows transferred", "trace (jade_trace_jacket_hp_1)"]):
    d.text((10 + j * (CW + 10), 15), t, font=F, fill=(30, 30, 30))
y = 50
for lab, ims, hh in blocks:
    d.text((10, y), lab, font=FS, fill=(80, 80, 80))
    for j, im in enumerate(ims): c.paste(im, (10 + j * (CW + 10), y + 22))
    y += hh + 40
txt = ["Brow-to-eye gap = (upper-lid y - brow-bottom y) / eye width, MediaPipe landmarks (R = her right brow, L = her left):",
       "trace 0.68 / 0.68 | front: v5 0.35 / 0.35, v6A 0.31 / 0.31, v6B 0.66 / 0.70 | 3/4: v5 0.49 / 0.45, v6A 0.49 / 0.45, v6B 0.70 / 0.64",
       "expr1: v5 0.31 / 0.30, v6A 0.30 / 0.30, v6B 0.67 / 0.68 | expr2: v5 0.42 / 0.43, v6A 0.42 / 0.43, v6B 0.68 / 0.66 | lineup: v5 0.30 / 0.34, v6A 0.27 / 0.30, v6B 0.65 / 0.68",
       "v6A trims the bottom (top anchored), so its gap grows only slightly; v6B places the trace brows at the trace's gap ratio (eye-corner similarity + vertical correction)."]
txt = TXT if "TXT" in globals() else txt
for i, t in enumerate(txt): d.text((10, y + 5 + i * 26), t, font=FS, fill=(40, 40, 40))
c.save(OUT if "OUT" in globals() else V + "review/jade_v6_brows.jpg", quality=90); print(c.size)
