"""Writes tools/sprites/others.json (eraser boss, bugs, HUD portraits) from the chosen raw sheets."""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import boxes as B
R = "/home/jade/Documents/vibesong"
def comps(src): return B.components(src)[1]
cfg = {"root": R, "out_dir": R + "/assets/sprites", "review_dir": R + "/assets/sheets/review", "meta": R + "/assets/sprites/sprites.json", "sheets": []}

# ERASER (raw rectangles; scale ~6 sheet px per game px = the sheet's own pixel size)
src = R + "/assets/sheets/raw/eraser_pixel_t1.png"; b = comps(src)
cfg["sheets"].append(dict(name="eraser", src=src, target_h=53, ref_box=[0, 228, 10, 546], frame="auto", palette_n=24, align="center",
    review_bg=[150, 170, 190], anims={
    "chase": dict(frames=[[[20, 200, 400, 560]], [[405, 200, 760, 560]], [[765, 200, 1130, 560]]], fps=6,
                  note="scrubbing right; erased white smear + crumbs baked in on the left"),
    "loom": dict(frames=[[[1160, 60, 1515, 572]]], loop=False),
    "redeemed": dict(frames=[[[50, 590, 400, 950]], [[440, 590, 790, 950]], [[790, 590, 1150, 950]]], fps=6, note="pink, frame 2 = singing"),
    "crumbs": dict(frames=[[b[13]], [b[14]], [b[15]], [b[16]]], frame=[14, 14], loop=False, note="particle variants, not an animation"),
    "sparkle": dict(frames=[[b[22]], [b[23]]], frame=[14, 16], fps=8),
}))
# CHARLIE HAT PROPS (separate sprites the engine spawns next to Charlie)
src = R + "/assets/sheets/raw/charlie_hat_props_t1.png"
cfg["sheets"].append(dict(name="charlie_prop", src=src, target_h=17, ref_box=[0, 209, 1, 325], palette_n=12, min_blob=3, align="center",
    fit_phase=True, inner=0.6, anims={
    "trampoline": dict(name="charlie_prop_trampoline", frames=[[[230, 150, 540, 340]], [[610, 220, 920, 340]], [[960, 140, 1340, 340]]],
                       frame="auto", fps=12, loop=False, note="0 rest, 1 squash (landing), 2 spring back"),
    "boomerang": dict(name="charlie_prop_boomerang", frames=[[[90, 420, 360, 580]], [[460, 420, 700, 600]], [[820, 440, 1080, 590]], [[1180, 440, 1480, 580]]],
                      frame="auto", fps=16),
    "parachute": dict(name="charlie_prop_parachute", frames=[[[140, 690, 545, 895]], [[610, 690, 1010, 895]]], frame="auto", fps=4),
    "hat_stack": dict(name="charlie_prop_hat_stack", frames=[[[1120, 630, 1430, 920]]], frame="auto", loop=False, note="more hats pulled from the hat"),
}))
# BUGS
src = R + "/assets/sheets/raw/bugs_pixel_t1.png"; b = comps(src)
bugs = ["ladybug", "beetle", "moth", "caterpillar", "firefly"]
feat = {"ladybug": "button", "beetle": "wheel", "moth": "glider", "caterpillar": "bridge", "firefly": "lamp"}
anims = {}
for k, bug in enumerate(bugs):
    i = 5 * k   # per row: note, idleA, idleB, dance, feature
    note, ia, ib, da, fe = b[i:i + 5]
    anims[bug + "_idle"] = dict(name=f"bug_{bug}_idle", frames=[[ia], [ib]], frame=[34, 34], fps=3, align="center")
    anims[bug + "_dance"] = dict(name=f"bug_{bug}_dance", frames=[[da, note]], frame=[34, 40], align="center", note="pose + pixel music note")
    anims[bug + "_feature"] = dict(name=f"bug_{bug}_{feat[bug]}", frames=[[fe]], frame="auto", align="center", loop=False,
                                   note=f"{bug} after the dance battle -> {feat[bug]}")
cfg["sheets"].append(dict(name="bugs", src=src, target_h=23, ref_box=b[1], palette_n=24, min_blob=4, anims=anims))
# HUD PORTRAITS: square head crops from the top of each portrait, 32x32
src = R + "/assets/sheets/raw/portraits_t1.png"; b = comps(src)
def sq(bx, h=None):
    x0, y0, x1, y1 = bx; w = x1 - x0; h = h or w; cx = (x0 + x1) // 2
    return [cx - h // 2, y0, cx + h // 2, y0 + h]
for k, who in enumerate(["jade", "charlie", "ricky"]):
    n, s = b[1 + 2 * k], b[2 + 2 * k]
    extra = dict(force=[[248, 96, 116], [248, 184, 40], [40, 104, 216]], protect=[[248, 96, 116], [248, 184, 40], [40, 104, 216]], boost=3.0) if who == "jade" else {}
    cfg["sheets"].append(dict(name="portraits_" + who, src=src, target_h=32, ref_box=[0, 0, 1, 300], palette_n=20, cover=0.5, dark_boost=1.0, fit_phase=True, inner=0.6,
        anims={who: dict(name=f"portrait_{who}", frames=[[sq(n, 300)], [sq(s, 300)]], frame=[32, 32], align="center", fps=4,
                         note="0 = neutral, 1 = singing/excited")}, **extra))
# Jade v2 portrait (racer collar, X pencils) replaces the v1 one
J2 = R + "/assets/sheets/raw/jade2_portraits_b.png"
cfg["sheets"] = [s for s in cfg["sheets"] if s["name"] != "portraits_jade"]
K = [[248, 200, 40], [40, 100, 230], [240, 100, 140], [110, 170, 240]]
cfg["sheets"].append(dict(name="portraits_jade", src=J2, target_h=32, ref_box=[0, 0, 1, 590], palette_n=20, cover=0.5, dark_boost=1.0,
    fit_phase=True, inner=0.6, force=K, protect=K, boost=3.0, anims={"jade": dict(name="portrait_jade",
    frames=[[[148, 200, 738, 790]], [[846, 200, 1436, 790]]], frame=[32, 32], align="center", fps=4,
    note="0 = neutral, 1 = singing; v2: racer collar + snap tab, chest dot, X pencils (blue / pink caps)")}))
json.dump(cfg, open(R + "/tools/sprites/others.json", "w"), indent=1)
