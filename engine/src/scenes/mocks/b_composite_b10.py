"""MOCKS B10 (81.8, THE TURN): composite the mocks-show overlay (rendered on a #ff00ff key) over the MAIN show at 81.8.

    cd engine
    node render.js --show main  --res 1920x1080 --stills 81.8:out/mocks/_b10_base.png
    node render.js --show mocks --res 1920x1080 --stills 81.8:out/mocks/_B10_overlay.png
    ../.venv/bin/python src/scenes/mocks/b_composite_b10.py
"""
import sys
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[3] / 'out' / 'mocks'
base = Image.open(OUT / '_b10_base.png').convert('RGB')
ov = Image.open(OUT / '_B10_overlay.png').convert('RGB')
assert base.size == ov.size, (base.size, ov.size)
# key: anything near pure magenta is transparent
px = ov.load(); W, H = ov.size
m = Image.new('L', ov.size, 0); mp = m.load()
for y in range(H):
    for x in range(W):
        R, G, B = px[x, y]
        if not (R > 200 and G < 60 and B > 200):
            mp[x, y] = 255
out = base.copy(); out.paste(ov, (0, 0), m)
dst = OUT / 'B10_turn_composite.png'
out.save(dst); print('wrote', dst, file=sys.stderr)
