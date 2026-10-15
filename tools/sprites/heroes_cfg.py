"""Writes tools/sprites/heroes.json from component indices of the chosen raw sheets (indices from boxes.py)."""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import boxes as B
R = "/home/jade/Documents/vibesong"
def comps(src): return B.components(src)[1]
def F(bx, *groups): return [[bx[i] for i in g] for g in groups]

cfg = {"root": R, "out_dir": R + "/assets/sprites", "review_dir": R + "/assets/sheets/review", "meta": R + "/assets/sprites/sprites.json", "sheets": []}
FR = [36, 44]
# JADE (v2: racer jacket, X pencils; updo when hands are empty, hair down when the pencils are in her hands)
UA = R + "/assets/sheets/raw/jade2_pix_updo_a.png"; ua = comps(UA)
UB = R + "/assets/sheets/raw/jade2_pix_updo_b.png"; ub = comps(UB)
DB = R + "/assets/sheets/raw/jade2_pix_down_b.png"; db = comps(DB)
KEY = [[248, 168, 8], [16, 90, 236], [248, 80, 112], [96, 160, 244]]          # pencil yellow, blue cap, pink cap, pale-blue dot
RAIN = [[248, 8, 8], [8, 184, 8], [248, 224, 8], [248, 112, 8], [150, 150, 158]]   # rainbow stroke + graphite line
cfg["sheets"].append(dict(name="jade", src=UA, target_h=40, ref_box=ua[0], frame=FR, palette_n=24, fit_phase=True, inner=0.6,
    dark_boost=1.3, min_blob=2, force=KEY + RAIN, protect=KEY + RAIN, boost=3.0,
    anims={
    "idle": dict(frames=F(ua, [0], [1]), fps=3, note="updo + X pencils (blue cap / pink cap)"),
    "jump": dict(frames=F(ua, [2], [3]), loop=False, note="0 = rising, 1 = falling"),
    "victory": dict(frames=F(ua, [4]), frame=[40, 44], loop=False),
    "back": dict(src=UB, frames=F(ub, [5]), ref_box=ub[0], target_h=40, loop=False, note="seen from behind: big pale-blue dot on the jacket back"),
    "run": dict(src=UB, frames=F(ub, [6], [7], [8], [9], [10], [11]), ref_box=ub[0], target_h=40, fps=12,
                note="updo; contact, down, passing x2; sleeve patch visible"),
    "draw_rainbow": dict(src=DB, frames=F(db, [0]), ref_box=db[2], target_h=37, frame=[72, 44], loop=False,
                         note="HAIR DOWN; blue-cap pencil = FUNCTIONS, rainbow stroke baked in"),
    "draw_graphite": dict(src=DB, frames=F(db, [1]), ref_box=db[2], target_h=37, frame=[72, 44], loop=False,
                          note="HAIR DOWN; pink-cap pencil = FIXTURES, graphite line baked in"),
    "sing": dict(src=DB, frames=F(db, [2, 3, 4], [5, 6, 7]), ref_box=db[2], target_h=37, frame=[56, 44], fps=4, note="HAIR DOWN; pencil as mic"),
    "drum": dict(src=DB, frames=F(db, [8], [9]), ref_box=db[2], target_h=37, frame=[44, 44], fps=8, note="HAIR DOWN; pencils as drumsticks"),
    "run_hairdown": dict(src=DB, frames=F(db, [10], [11]), ref_box=db[2], target_h=37, frame=[40, 44], fps=10,
                         note="HAIR DOWN, a pencil in each hand; 2-frame run for ability moments"),
}))
rs = R + "/assets/sheets/raw/charlie_run_t1.png"; rb = comps(rs)
src = R + "/assets/sheets/raw/charlie_pixel_t2.png"; b = comps(src)
cfg["sheets"].append(dict(name="charlie", src=src, target_h=40, ref_box=b[0], frame=FR, fit_phase=True, inner=0.6, dark_boost=1.3, min_blob=2, palette_n=24,
    remap=[[[249, 159, 72], [240, 186, 140]], [[224, 128, 48], [206, 144, 104]]], remap_tol=40, anims={
    "idle": dict(frames=F(b, [0], [1]), fps=3),
    "jump": dict(frames=F(b, [2], [3]), loop=False, note="0 = rising, 1 = falling"),
    "run": dict(src=rs, frames=F(rb, [0], [1], [2], [3], [4], [5]), ref_box=rb[2], target_h=40, fps=12,
                note="contact, down, passing x2 (dedicated run sheet)"),
    "hat_shield": dict(frames=F(b, [13, 10], [14, 11], [15, 12]), frame=[36, 52], fps=6, note="ink drop bouncing off the cap"),
    "hat_parachute": dict(frames=F(b, [16], [17], [18]), frame=[36, 48], fps=6),
    "hat_trampoline": dict(frames=F(b, [19], [20]), frame=[44, 44], fps=4, note="cap flipped on the ground; spawn as a separate bounce prop if needed"),
    "hat_throw": dict(frames=F(b, [21], [22]), frame=[44, 44], loop=False),
    "hat_boomerang": dict(frames=F(b, [23], [24], [25]), frame=[16, 16], fps=12, align="center", note="projectile only"),
    "hat_pull": dict(frames=F(b, [26], [27], [28]), frame=[40, 44], fps=4, loop=False, note="pulls another cap out of the cap"),
}))
rs = R + "/assets/sheets/raw/ricky_run_t1.png"; rb = comps(rs)
src = R + "/assets/sheets/raw/ricky_pixel_t2.png"; b = comps(src)
cfg["sheets"].append(dict(name="ricky", src=src, target_h=40, ref_box=b[0], frame=FR, fit_phase=True, inner=0.6, dark_boost=1.3, min_blob=2, palette_n=24,
    force=[[128, 160, 222], [246, 246, 246], [236, 236, 236]], protect=[[128, 160, 222]], boost=1.6,
    remap=[[[246, 166, 84], [238, 184, 140]], [[200, 116, 50], [200, 136, 100]]], anims={
    "idle": dict(frames=F(b, [0], [1]), fps=3),
    "jump": dict(frames=F(b, [2], [3]), loop=False, note="0 = rising, 1 = falling"),
    "run": dict(src=rs, frames=F(rb, [0], [1], [2], [3], [4], [5]), ref_box=rb[2], target_h=40, fps=12,
                note="contact, down, passing x2 (dedicated run sheet)"),
    "power_chord": dict(frames=F(b, [10], [11]), frame=[64, 44], fps=8, loop=False, note="1 = blast with muzzle flash baked in"),
    "sustain": dict(frames=F(b, [12, 13, 14], [15, 16, 17, 18]), frame=[44, 44], fps=4, note="sound-wave arcs baked in"),
    "victory": dict(frames=F(b, [19]), frame=[36, 48], loop=False),
}))
json.dump(cfg, open(R + "/tools/sprites/heroes.json", "w"), indent=1)
