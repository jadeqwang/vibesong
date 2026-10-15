"""Compose the presentation sheets in assets/sheets/ from the engine strips (assets/sprites/) and the paper/concept art."""
import json
from PIL import Image, ImageDraw, ImageFont
A = "/home/jade/Documents/vibesong/assets/"
S, SH = A + "sprites/", A + "sheets/"
meta = json.load(open(S + "sprites.json"))["sprites"]
F = lambda n: ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", n)
FM = lambda n: ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", n)
BG, PANEL, INK, SUB = (24, 28, 38), (44, 52, 68), (236, 238, 244), (150, 160, 178)

def strip(n, z):
    im = Image.open(S + meta[n]["file"]).convert("RGBA")
    return im.resize((im.width * z, im.height * z), Image.NEAREST)

def frames_row(n, z, gap=6):
    """Split a strip into frames and lay them out with gaps on a panel colour."""
    m = meta[n]; im = Image.open(S + m["file"]).convert("RGBA"); fw, fh = m["frame_w"], m["frame_h"]
    out = Image.new("RGBA", (m["frames"] * (fw * z + gap) - gap, fh * z), (0, 0, 0, 0))
    for k in range(m["frames"]):
        f = im.crop((k * fw, 0, (k + 1) * fw, fh)).resize((fw * z, fh * z), Image.NEAREST)
        bgc = Image.new("RGBA", f.size, PANEL + (255,)); bgc.alpha_composite(f)
        out.alpha_composite(bgc, (k * (fw * z + gap), 0))
    return out

def sheet(rows, title, sub, out, z=4, pad=40, label_w=260):
    blocks = []
    for lab, names in rows:
        ims = [frames_row(n, z) for n in names]
        dd = ImageDraw.Draw(Image.new("RGB", (1, 1)))
        w = sum(max(i.width, int(dd.textlength(f"{n}  {meta[n]['frames']}x{meta[n]['frame_w']}x{meta[n]['frame_h']}", font=FM(16)))) for n, i in zip(names, ims)) + 24 * len(ims)
        h = max(i.height for i in ims)
        blocks.append((lab, names, ims, w, h))
    W = pad * 2 + label_w + max(b[3] for b in blocks); H = 150 + sum(b[4] + 54 for b in blocks) + pad
    c = Image.new("RGBA", (W, H), BG + (255,)); d = ImageDraw.Draw(c)
    d.text((pad, 34), title, font=F(44), fill=INK); d.text((pad, 92), sub, font=FM(20), fill=SUB)
    y = 150
    for lab, names, ims, w, h in blocks:
        d.text((pad, y + 6), lab, font=F(26), fill=INK)
        x = pad + label_w
        for n, im in zip(names, ims):
            c.alpha_composite(im, (x, y + 26))
            m = meta[n]; lab_ = f"{n}  {m['frames']}x{m['frame_w']}x{m['frame_h']}"
            d.text((x, y), lab_, font=FM(16), fill=SUB)
            x += max(im.width, int(d.textlength(lab_, font=FM(16)))) + 24
        y += h + 54
    c.convert("RGB").save(out); print(out, c.size)

# 1. party pixel sheet
rows = []
for who, abil in [("jade", ["bun_pull", "draw_rainbow", "draw_graphite", "sing", "drum", "run_hairdown", "victory"]),
                  ("charlie", ["hat_shield", "hat_parachute", "hat_trampoline", "hat_throw", "hat_boomerang", "hat_pull"]),
                  ("ricky", ["power_chord", "sustain", "victory"])]:
    rows.append((who.upper(), [f"{who}_idle", f"{who}_jump", f"{who}_run", f"{who}_hang"] + (["jade_back"] if who == "jade" else [])))
    rows.append(("  abilities", [f"{who}_{a}" for a in abil]))
    if who == "charlie":
        rows.append(("  hat props", ["charlie_prop_trampoline", "charlie_prop_boomerang", "charlie_prop_parachute", "charlie_prop_hat_stack"]))
sheet(rows, "PARTY: 16-bit sprites (engine strips, shown 4x)",
      "assets/sprites/<name>_<anim>.png  |  1 texel = 1 game px  |  anchor = feet  |  palette <= 24/character", SH + "party_pixel_sheet.png")

# 4. bugs
bugs = [("LADYBUG", "ladybug", "button"), ("BEETLE", "beetle", "wheel"), ("MOTH", "moth", "glider"),
        ("CATERPILLAR", "caterpillar", "bridge"), ("FIREFLY", "firefly", "lamp")]
sheet([(L, [f"bug_{b}_idle", f"bug_{b}_dance", f"bug_{b}_{f}"]) for L, b, f in bugs], "BUGS: idle / dance-battle / feature form (6x)",
      "never killed: a dance battle turns each bug into a level feature", SH + "bugs_sheet.png", z=6, label_w=280)

# 2. HUD portraits: a Lost Vikings-style status bar + the two expressions large
z = 4; P = 32 * z
bar = Image.new("RGBA", (3 * (P + 24 + 4 * 52) + 4 * 30, P + 60), (20, 20, 28, 255)); d = ImageDraw.Draw(bar)
x = 30
for who in ["jade", "charlie", "ricky"]:
    d.rectangle((x - 6, 24, x + P + 6, 30 + P + 6), fill=(70, 74, 92), outline=(170, 176, 196), width=3)
    im = Image.open(S + f"portrait_{who}.png").convert("RGBA").crop((0, 0, 32, 32)).resize((P, P), Image.NEAREST)
    bgc = Image.new("RGBA", (P, P), (40, 46, 70, 255)); bgc.alpha_composite(im); bar.alpha_composite(bgc, (x, 30))
    for k in range(4):   # item slots
        sx = x + P + 24 + k * 52; d.rectangle((sx, 30 + P - 46, sx + 44, 30 + P - 2), fill=(36, 38, 52), outline=(120, 124, 146), width=2)
    for k in range(3):   # health pips
        d.ellipse((x + P + 24 + k * 22, 34, x + P + 24 + k * 22 + 16, 50), fill=(220, 60, 60))
    x += P + 24 + 4 * 52 + 30
z2 = 8
W = max(bar.width, 6 * (32 * z2 + 30)) + 80
c = Image.new("RGBA", (W, 150 + bar.height + 60 + 32 * z2 + 90), BG + (255,)); d = ImageDraw.Draw(c)
d.text((40, 34), "HUD PORTRAITS (32x32, neutral / singing)", font=F(44), fill=INK)
d.text((40, 92), "assets/sprites/portrait_<name>.png: 2-frame strip, frame 0 = neutral, 1 = singing. Bar below is a layout mock (4x).", font=FM(20), fill=SUB)
c.alpha_composite(bar, (40, 150)); y = 150 + bar.height + 60; x = 40
for who in ["jade", "charlie", "ricky"]:
    st = Image.open(S + f"portrait_{who}.png").convert("RGBA")
    for k, lab in enumerate(["neutral", "singing"]):
        f = st.crop((k * 32, 0, k * 32 + 32, 32)).resize((32 * z2, 32 * z2), Image.NEAREST)
        bgc = Image.new("RGBA", f.size, PANEL + (255,)); bgc.alpha_composite(f); c.alpha_composite(bgc, (x, y))
        d.text((x, y + 32 * z2 + 8), f"{who} / {lab}", font=FM(20), fill=SUB); x += 32 * z2 + 30
c.convert("RGB").save(SH + "hud_portraits.png"); print("hud", c.size)

# 3. eraser: pixel strips + concepts
rows = [("PIXEL", ["eraser_chase", "eraser_loom"]), ("", ["eraser_redeemed", "eraser_crumbs", "eraser_sparkle"])]
sheet(rows, "THE ERASER: boss", "pixel strips at 4x (+ Scale2x *_x2.png variants for a screen-filling wall); concepts below",
      "/tmp/claude-1000/-home-jade-Documents-vibesong/4a0ec359-ab98-423d-9be8-297e588f7098/scratchpad/_eraser_top.png", z=4, label_w=160)
top = Image.open("/tmp/claude-1000/-home-jade-Documents-vibesong/4a0ec359-ab98-423d-9be8-297e588f7098/scratchpad/_eraser_top.png")
paint = Image.open(SH + "raw/eraser_concept_paint_t1.jpg").convert("RGB")
d3 = Image.open(SH + "raw/eraser_concept3d_t3.png").convert("RGB")
W = max(top.width, 2400)
paint = paint.resize((W - 80, int(paint.height * (W - 80) / paint.width)))
d3 = d3.resize((W - 80, int(d3.height * (W - 80) / d3.width)))
c = Image.new("RGB", (W, top.height + paint.height + d3.height + 160), BG); c.paste(top, (0, 0)); d = ImageDraw.Draw(c)
y = top.height
d.text((40, y), "PAINTERLY CONCEPT (nano-banana-pro)", font=F(26), fill=INK); c.paste(paint, (40, y + 40)); y += paint.height + 80
d.text((40, y), "3D / TALOS CONCEPT (gpt-image-2.5-sunburst)", font=F(26), fill=INK); c.paste(d3, (40, y + 40))
c.save(SH + "eraser_boss_sheet.png"); print("eraser", c.size)

# 5. paper sheet (v9 = Jade-approved likeness 2026-10-14, on the v3 base)
lin = Image.open(SH + "paper/paper_lineup.png").convert("RGB")
turn = Image.open(SH + "paper/paper_jade_turnaround_2x.png").convert("RGB")
ex = [Image.open(SH + f"paper/paper_expr_{w}.png").convert("RGB") for w in ["jade", "charlie", "ricky"]]
W = 3400; m = 40; CREAM = (247, 241, 228); INK2 = (60, 52, 44)
def fitw(im, w): return im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
l1 = fitw(lin, W - 2 * m); tu = fitw(turn, W - 2 * m); e = [fitw(x, (W - 4 * m) // 3) for x in ex]
H = 120 + l1.height + 70 + tu.height + 70 + max(x.height for x in e) + 2 * m
c = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(c)
d.text((m, 34), "PAPER: cutscene look (colored pencil on cream)", font=F(44), fill=INK2)
y = 120; c.paste(l1, (m, y)); d.text((m, y - 26), "lineup (v9 = Jade-approved likeness 2026-10-14; v3 base: jacket from a same-image nano-banana-pro edit, real 1420 MHz patch composited, brows thickened)", font=FM(20), fill=INK2)
y += l1.height + 70; d.text((m, y - 30), "Jade turnaround (v9 = Jade-approved likeness 2026-10-14; v3 base: collar/epaulets/dots from a same-image edit, real patch + RARE EARTH artwork, blue cap fixed, rainbow leads)", font=FM(20), fill=INK2); c.paste(tu, (m, y))
y += tu.height + 70; x = m
for w, im in zip(["Jade", "Charlie", "Ricky"], e):
    d.text((x, y - 30), f"{w}: expressions (neutral, smile, sing soft, sing loud, laugh, determined)", font=FM(18), fill=INK2); c.paste(im, (x, y)); x += im.width + m
c.save(SH + "party_paper_sheet.png"); print("paper", c.size)
