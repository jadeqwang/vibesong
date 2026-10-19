"""A-2 review sheets (assets/sheets/review/a2_*.png): every new strip at 8x per game pixel, frame cells outlined, names + anchors.
Eraser *_x2 strips have 2 texels per game pixel, so they are shown at 4x per texel (= 8x per game pixel)."""
import json, sys
from PIL import Image, ImageDraw, ImageFont
R = "/home/jade/Documents/vibesong"; SP = R + "/assets/sprites/"; OUT = R + "/assets/sheets/review/"
meta = json.load(open(SP + "sprites.json"))["sprites"]
try: FONT = ImageFont.truetype(R + "/engine/assets/fonts/Inter.ttf", 22)
except OSError: FONT = ImageFont.load_default()
def sheet(path, groups, bg=(104, 122, 140)):
    rows = []
    for name, z in groups:
        m = meta[name]; im = Image.open(SP + m["file"]).convert("RGBA")
        W, H = m["frame_w"], m["frame_h"]
        big = Image.new("RGBA", ((W * z + 12) * m["frames"], H * z), bg + (255,))
        for k in range(m["frames"]):
            fr = im.crop((k * W, 0, k * W + W, H)).resize((W * z, H * z), Image.NEAREST)
            x = k * (W * z + 12); cell = Image.new("RGBA", fr.size, bg + (255,)); cell.alpha_composite(fr); big.paste(cell, (x, 0))
            d = ImageDraw.Draw(big); d.rectangle([x, 0, x + W * z - 1, H * z - 1], outline=(70, 84, 100))
            ax, ay = m["anchor"]; d.line([x + ax * z, ay * z + z // 2, x + ax * z + z, ay * z + z // 2], fill=(255, 60, 200), width=2)
            d.line([x + ax * z + z // 2, ay * z, x + ax * z + z // 2, ay * z + z], fill=(255, 60, 200), width=2)
        label = f"{name}   {W}x{H} x{m['frames']}   anchor {m['anchor']}   fps {m['fps']}{' loop' if m['loop'] else ''}   ({z}x per texel)"
        rows.append((label, big))
    Wt = max(b.width for _, b in rows) + 32; Ht = sum(b.height + 44 for _, b in rows) + 16
    c = Image.new("RGB", (Wt, Ht), (30, 32, 40)); d = ImageDraw.Draw(c); y = 8
    for label, b in rows:
        d.text((16, y), label, fill=(255, 220, 90), font=FONT); y += 34; c.paste(b, (16, y), b); y += b.height + 10
    c.save(path); print(path, c.size)
if __name__ == "__main__":
    sheet(OUT + "a2_portrait_x8.png", [("portrait_jade", 8), ("portrait_jade_hairdown", 8)], bg=(29, 32, 48))
    sheet(OUT + "a2_jade_x8.png", [("jade_twin_draw", 8), ("jade_erase", 8), ("jade_dangle", 8), ("jade_read", 8)])
    sheet(OUT + "a2_ricky_charlie_x8.png", [("ricky_dangle", 8), ("ricky_dangle_play", 8), ("ricky_read", 8),
                                            ("charlie_parachute_carry", 8), ("charlie_read", 8)])
    sheet(OUT + "a2_eraser_x8.png", [("eraser_blink_x2", 4), ("eraser_skid_x2", 4), ("eraser_peer_x2", 4), ("eraser_smear_x2", 4)])
    sheet(OUT + "a2_props_x8.png", [("prop_page_zitie", 8), ("prop_page_tab", 8), ("prop_page_spec", 8), ("prop_hat_canopy", 8)])
