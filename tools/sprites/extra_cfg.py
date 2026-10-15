"""Hang/grab strips (all heroes) + Jade bun-pull strip, palettes locked to each hero's existing strips."""
import json, glob, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import boxes as B
R = "/home/jade/Documents/vibesong"
SP = R + "/assets/sprites/"
cfg = {"root": R, "out_dir": SP, "review_dir": R + "/assets/sheets/review", "meta": SP + "sprites.json", "sheets": []}
H = R + "/assets/sheets/raw/hang_t1.png"; hb = B.components(H)[1]
def pal(who): return [f for f in glob.glob(SP + who + "_*.png") if "_x2" not in f and "prop" not in f]
for k, who in enumerate(["jade", "charlie", "ricky"]):
    cfg["sheets"].append(dict(name=who + "_hangsheet", src=H, target_h=43, ref_box=hb[2 * k], frame=[36, 44], palette_from=pal(who),
        fit_phase=True, inner=0.6, dark_boost=1.3, min_blob=2, align="center", review_bg=[104, 122, 140],
        anims={"hang": dict(name=who + "_hang", frames=[[hb[2 * k]], [hb[2 * k + 1]]], fps=4, align="center",
                            note="hanging from a bar/ledge (bar baked in at the top, hands at y~2): 0 legs forward, 1 legs back; anchor = hands")}))
Bp = R + "/assets/sheets/raw/bunpull_t1.png"; bb = B.components(Bp)[1]
cfg["sheets"].append(dict(name="jade_bunpullsheet", src=Bp, target_h=44, ref_box=[0, 276, 1, 812], frame=[36, 44], palette_from=pal("jade"),
    fit_phase=True, inner=0.6, dark_boost=1.3, min_blob=2,
    anims={"bun_pull": dict(name="jade_bun_pull", frames=[[bb[0]], [bb[1]], [bb[2]]], fps=6, loop=False,
                            note="hair-up -> hair-down transition: 0 reach to bun, 1 blue pencil out + hair half down, 2 hair down, both pencils in hand")}))
json.dump(cfg, open(R + "/tools/sprites/extra.json", "w"), indent=1)
