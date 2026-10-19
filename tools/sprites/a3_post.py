"""A-3 post-pass: Jade pencil canon on the _hi strips, then install them (sprites.json backed up first) + review sheets.
Usage: a3_post.py STAGE_DIR name[,name...]   (names = low-res strip names; STAGE has <name>_hi.png from a3_hi.py extract)

Pencil rules (Jade only):
  A. wherever the canon-audited low-res strip (Scale2x) has a pencil colour, the _hi pixel takes that colour, so caps,
     bodies and tips are exactly the audited ones (blue cap + rainbow core / pink cap + graphite core, never matching);
  B. hair-UP strips: any pencil colour the model added inside the upper 45% of the sprite where the low-res has none
     (e.g. tips drawn on the back of the bun) goes back to the low-res colour, so no tip lies on the hair."""
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scale2x as S2
import a2_install as I
R = "/home/jade/Documents/vibesong"; SP = R + "/assets/sprites/"
PENCIL = np.array([[0x08, 0xb8, 0x08], [0x10, 0x5a, 0xec], [0x28, 0x68, 0xd8], [0x46, 0xc8, 0x60], [0xf0, 0x40, 0x48], [0xf0, 0x64, 0x8c],
                   [0xf8, 0x50, 0x70], [0xf8, 0xa8, 0x08], [0xf8, 0xb8, 0x28], [0xf8, 0xe0, 0x08], [0xe8, 0xc4, 0x96]])
HAIR_UP = {"jade_idle", "jade_run", "jade_back", "jade_jump", "jade_victory"}
def is_pencil(rgb): return (np.abs(rgb[..., None, :].astype(int) - PENCIL[None, None]).sum(-1) < 12).any(-1)

def fix_jade(name, hi, meta):
    m = meta[name]; low = np.array(Image.open(SP + m["file"]).convert("RGBA")); W2 = m["frame_w"] * 2
    out = []
    for k in range(m["frames"]):
        lf = low[:, k * m["frame_w"]:(k + 1) * m["frame_w"]].copy(); lf[lf[..., 3] == 0] = 0
        ref = S2.scale2x(lf); f = hi[:, k * W2:(k + 1) * W2].copy()
        op = ref[..., 3] > 0
        rp = is_pencil(ref[..., :3]) & op
        f[rp, :3] = ref[rp, :3]
        if name in HAIR_UP:
            ys = np.nonzero(op.any(1))[0]; top, bot = ys[0], ys[-1]
            head = np.zeros_like(op); head[: top + int((bot - top) * 0.45)] = True
            bad = is_pencil(f[..., :3]) & ~rp & head & op
            f[bad, :3] = ref[bad, :3]
        out.append(f)
    return np.concatenate(out, 1)

def install(stage, names):
    meta = json.load(open(SP + "sprites.json"))["sprites"]
    entries = []
    for n in names:
        m = meta[n]; hi = np.array(Image.open(f"{stage}/{n}_hi.png").convert("RGBA"))
        if n.startswith("jade_"): hi = fix_jade(n, hi, meta)
        assert hi.shape[1] == m["frame_w"] * 2 * m["frames"] and hi.shape[0] == m["frame_h"] * 2, n
        Image.fromarray(hi).save(SP + n + "_hi.png")
        e = dict(name=n + "_hi", file=n + "_hi.png", frame_w=m["frame_w"] * 2, frame_h=m["frame_h"] * 2, frames=m["frames"],
                 anchor=[m["anchor"][0] * 2, m["anchor"][1] * 2 + 1], fps=m["fps"], loop=m["loop"],
                 source="assets/sprites/" + m["file"] + " -> nano-banana-pro 2x redraw (tools/sprites/a3_hi.py, a3_post.py)",
                 note="A-3 2x-density strip for the voxel heroes; silhouette = Scale2x of " + n + " (same poses/timing); "
                      "hero palette + in-between shades." + (" " + m["note"] if m.get("note") else ""))
        entries.append(e)
    print("backup:", I.install(entries))
    return [e["name"] for e in entries]

def review(path, names, z=4):
    meta = json.load(open(SP + "sprites.json"))["sprites"]
    try: FONT = ImageFont.truetype(R + "/engine/assets/fonts/Inter.ttf", 20)
    except OSError: FONT = ImageFont.load_default()
    rows = []
    for n in names:
        m = meta[n]; im = Image.open(SP + m["file"]).convert("RGBA")
        bg = Image.new("RGBA", im.size, (104, 122, 140, 255)); bg.alpha_composite(im)
        rows.append((f"{n}  {m['frame_w']}x{m['frame_h']} x{m['frames']}  anchor {m['anchor']}  ({z}x per hi texel = 8x per game px)",
                     bg.resize((im.width * z, im.height * z), Image.NEAREST)))
    Wt = max(r.width for _, r in rows) + 32; Ht = sum(r.height + 40 for _, r in rows) + 10
    c = Image.new("RGB", (Wt, Ht), (30, 32, 40)); d = ImageDraw.Draw(c); y = 6
    for lab, r in rows:
        d.text((16, y), lab, fill=(255, 220, 90), font=FONT); y += 30; c.paste(r, (16, y)); y += r.height + 10
    c.save(path); print(path, c.size)

if __name__ == "__main__":
    stage, names = sys.argv[1], sys.argv[2].split(",")
    done = install(stage, names)
    if len(sys.argv) > 3: review(sys.argv[3], done)
