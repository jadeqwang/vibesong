import glob, os, sys
from PIL import Image
C = "/home/jade/Documents/vibesong/keyframes/concepts"
boxes = {
 "k01": (0.52, 0.12, 0.78, 0.55), "k03": (0.38, 0.03, 0.62, 0.60), "k03hud": (0.38, 0.55, 0.62, 0.75),
 "k04": (0.45, 0.05, 0.62, 0.50), "k04hud": (0.30, 0.83, 0.50, 0.98),
 "k05": (0.66, 0.15, 0.88, 0.58), "k06": (0.38, 0.22, 0.54, 0.60), "k07": (0.45, 0.62, 0.55, 0.95),
 "k08": (0.43, 0.36, 0.58, 0.80), "k08b": (0.31, 0.22, 0.45, 0.78), "k09": (0.50, 0.40, 0.66, 0.78),
 "k10": (0.55, 0.0, 1.0, 0.65), "k11": (0.18, 0.42, 0.36, 0.98),
}
os.makedirs("audit", exist_ok=True)
for k, (a, b, c, d) in boxes.items():
    p = sorted(glob.glob(f"{C}/{k[:3] if not k.startswith('k08b') else 'k08b'}_*.png"))[0]
    im = Image.open(p).convert("RGB"); W, H = im.size
    cr = im.crop((int(a*W), int(b*H), int(c*W), int(d*H)))
    s = 700 / cr.height
    cr = cr.resize((int(cr.width*s), 700), Image.LANCZOS)
    cr.save(f"audit/{k}.png"); print(k, os.path.basename(p), cr.size)
