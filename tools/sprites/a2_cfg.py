"""A-2 hero poses + eraser strips from the art11_* sheets. Builds into a STAGING dir (not assets/sprites): the
post-pass a2_post.py fixes pencils/anchors and installs via a2_install.py (sprites.json backed up first).
Usage: a2_cfg.py STAGE_DIR  -> writes tools/sprites/a2.json; then build.py tools/sprites/a2.json"""
import json, glob, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import boxes as B
R = "/home/jade/Documents/vibesong"; SP = R + "/assets/sprites/"; RAW = R + "/assets/sheets/raw/"
STAGE = sys.argv[1]
def pal(who): return [f for f in glob.glob(SP + who + "_*.png") if "_x2" not in f and "prop" not in f and "back" not in f]
def comps(n): return B.components(RAW + n + ".png")[1]
def grp(bx, mains):
    """union each main box with the small satellite blobs (crumbs, sweat drops) nearest to it"""
    out = [[list(m)] for m in mains]
    for b in bx:
        if b in mains: continue
        cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
        k = min(range(len(mains)), key=lambda i: abs(cx - (mains[i][0] + mains[i][2]) / 2) + abs(cy - (mains[i][1] + mains[i][3]) / 2))
        out[k].append(list(b))
    return out
cfg = {"root": R, "out_dir": STAGE, "review_dir": STAGE + "/review", "meta": STAGE + "/meta.json", "sheets": []}
common = dict(fit_phase=True, inner=0.6, dark_boost=1.3, min_blob=2)
# ---- Jade A: twin draw (44x44, 4) + erase (36x44, 3)
b = comps("a2_jade_a_t1")
cfg["sheets"].append(dict(name="a2_jade_a", src=RAW + "a2_jade_a_t1.png", target_h=37, ref_box=b[4], frame=[44, 44], palette_from=pal("jade"), **common,
    anims={"twin": dict(name="jade_twin_draw", frames=[[x] for x in b[0:4]], fps=8, loop=False),
           "erase": dict(name="jade_erase", frames=[[x] for x in b[4:7]], frame=[36, 44], fps=8)}))
# ---- Jade B: dangle (36x44, 2) + read (36x44, 2)
b = comps("a2_jade_b_t1")
cfg["sheets"].append(dict(name="a2_jade_b", src=RAW + "a2_jade_b_t1.png", target_h=38, ref_box=b[2], frame=[36, 44], palette_from=pal("jade"), **common,
    anims={"dangle": dict(name="jade_dangle", frames=[[x] for x in b[0:2]], fps=4, align="center"),
           "read": dict(name="jade_read", frames=[[x] for x in b[2:4]], fps=2)}))
# ---- Ricky: dangle (t2 sheet), dangle_play + read (t1 sheet)
b = comps("a2_ricky_t1")
cfg["sheets"].append(dict(name="a2_ricky", src=RAW + "a2_ricky_t1.png", target_h=40, ref_box=b[4], frame=[36, 44], palette_from=pal("ricky"), **common,
    anims={"dangle_play": dict(name="ricky_dangle_play", frames=[[x] for x in b[2:4]], frame=[36, 48], fps=4, align="center"),
           "read": dict(name="ricky_read", frames=[[x] for x in b[4:6]], fps=2)}))
b2 = comps("a2_ricky_dangle_t2")
cfg["sheets"].append(dict(name="a2_ricky_dangle", src=RAW + "a2_ricky_dangle_t2.png", target_h=42, ref_box=b2[0], frame=[36, 44], palette_from=pal("ricky"), **common,
    anims={"dangle": dict(name="ricky_dangle", frames=[[x] for x in b2[0:2]], fps=4, align="center")}))
# ---- Charlie: parachute carry (t2), read (t1)
b = comps("a2_charlie_t1"); c2 = comps("a2_charlie_t2")
cfg["sheets"].append(dict(name="a2_charlie_carry", src=RAW + "a2_charlie_t2.png", target_h=55, ref_box=c2[0], frame=[48, 56], palette_from=pal("charlie"), **common,
    anims={"carry": dict(name="charlie_parachute_carry", frames=[[x] for x in c2[0:3]], fps=6, align="center")}))
cfg["sheets"].append(dict(name="a2_charlie_read", src=RAW + "a2_charlie_t1.png", target_h=40, ref_box=b[3], frame=[36, 44], palette_from=pal("charlie"), **common,
    anims={"read": dict(name="charlie_read", frames=[[x] for x in b[3:5]], fps=2)}))
# ---- Eraser: skid (3), peer (2) at base size 66x62 (x2 made by scale2x in a2_post)
b = comps("a2_eraser_t1"); mains = [b[0], b[2], b[4], b[11], b[12]]
g = grp(b, mains)
cfg["sheets"].append(dict(name="a2_eraser", src=RAW + "a2_eraser_t1.png", target_h=50, ref_box=[0, 120, 1, 510],
    frame=[66, 62], palette_from=[SP + "eraser_chase.png", SP + "eraser_loom.png", SP + "eraser_sparkle.png"], **common, align="center",
    anims={"skid": dict(name="eraser_skid", frames=g[0:3], fps=8),
           "peer": dict(name="eraser_peer", frames=g[3:5], fps=3)}))
json.dump(cfg, open(R + "/tools/sprites/a2.json", "w"), indent=1)
