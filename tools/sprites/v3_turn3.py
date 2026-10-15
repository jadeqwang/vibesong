import sys; sys.path.insert(0, "/home/jade/Documents/vibesong/tools/sprites")
import numpy as np
from PIL import Image
from v3_paper import thicken_brows
import v3_pencils as VP
V = "/home/jade/Documents/vibesong/"
a = np.array(Image.open(V + "assets/sheets/raw/v3_turn_stage2.png").convert("RGB")).astype(np.float32)
print("cap px", VP.recolor_cap(a, (2340, 80, 2375, 112)))
# visible tips of the BLUE pencil: 3/4 (lower right of bun), side (below bun), back (lower left, after the cap swap)
VP.paint_point(a, (1146.5, 228.5), (0.72, 0.69), 10, 3.2)
VP.paint_point(a, (1759, 246), (0.15, 0.99), 10, 3.4)
VP.paint_point(a, (2220, 222.5), (-0.70, 0.71), 10, 3.6)
for box in [(250, 160, 520, 420), (880, 160, 1160, 420)]:
    a, info = thicken_brows(a, box, amount=0.95); print("brows", info)
Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(V + "assets/sheets/paper/paper_jade_turnaround.png")
im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)); im.resize((im.width * 2, im.height * 2), Image.LANCZOS).save(V + "assets/sheets/paper/paper_jade_turnaround_2x.png")
