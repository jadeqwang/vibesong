import sys; sys.path.insert(0, "/home/jade/Documents/vibesong/tools/sprites")
import numpy as np
from PIL import Image
from v3_paper import *
import costume_comp as CC
v1 = arr(V + "assets/sheets/raw/paper_jade_turn_t1.png"); ed = arr(V + "assets/sheets/raw/v3_turn_nbp_b.png", (2752, 1536))
keep = [headphone_mask(v1, (130, 260, 640, 420)), headphone_mask(v1, (770, 260, 1280, 420)), headphone_mask(v1, (1450, 260, 1960, 420))]
def ell(box):
    m = Image.new("L", (2752, 1536), 0); __import__("PIL.ImageDraw").ImageDraw.Draw(m).ellipse(box, fill=1); return np.array(m).astype(bool)
def rect(box):
    m = np.zeros((1536, 2752), bool); m[box[1]:box[3], box[0]:box[2]] = True; return m
# keep v1 where the edit drew placeholder patch rings / its own lettering (real artwork goes there instead)
keep += [ell((525, 440, 600, 535)), ell((1148, 440, 1224, 530)), ell((1636, 440, 1724, 530)), rect((2095, 440, 2150, 545)), rect((2220, 515, 2400, 552))]
regions = [(60, 0, 700, 900, 306), (700, 0, 1350, 900, 305), (1400, 0, 1980, 900, 297), (2050, 0, 2700, 900, 300)]
out, take = diff_composite(v1, ed, regions, keep)
Image.fromarray((take * 255).astype(np.uint8)).save("/tmp/claude-1000/-home-jade-Documents-vibesong/4a0ec359-ab98-423d-9be8-297e588f7098/scratchpad/take.png")
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(V + "assets/sheets/raw/v3_turn_stage1.png")
print("ok")
