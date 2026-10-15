"""A-1 back-view strips for the 3D voxel heroes (palettes locked to each hero's existing strips)."""
import json, glob, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import boxes as B
R = "/home/jade/Documents/vibesong"; SP = R + "/assets/sprites/"
src = R + "/assets/sheets/raw/backs_t1.png"; b = B.components(src)[1]
def pal(who): return [f for f in glob.glob(SP + who + "_*.png") if "_x2" not in f and "prop" not in f and "back" not in f]
cfg = {"root": R, "out_dir": SP, "review_dir": R + "/assets/sheets/review", "meta": SP + "sprites.json", "sheets": []}
for k, (who, name) in enumerate([("charlie", "charlie_back"), ("ricky", "ricky_back"), ("jade", "jade_back_hairdown")]):
    r = b[6 * k:6 * k + 6]
    cfg["sheets"].append(dict(name=name + "sheet", src=src, target_h=41, ref_box=r[0], frame=[36, 44], palette_from=pal(who),
        fit_phase=True, inner=0.6, dark_boost=1.3, min_blob=2, anims={
        "idle": dict(name=name, frames=[[r[0]], [r[1]]], fps=3, note="back view (A-1), idle; voxel rear half"),
        "run": dict(name=name + "_run", frames=[[x] for x in r[2:6]], fps=10, note="back view, running away")}))
json.dump(cfg, open(R + "/tools/sprites/backs.json", "w"), indent=1)
