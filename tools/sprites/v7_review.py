COLS = ["v6A", "v6B", "v7"]
HEAD = ["v6A (colour ok, reads thick)", "v6B (thickness ok, artifacts)", "v7: clean redraw", "trace (jade_trace_jacket_hp_1)"]
OUT = "/home/jade/Documents/vibesong/assets/sheets/review/jade_v7_brows.jpg"
TXT = ["Brow-to-eye gap = (upper-lid y - brow-bottom y) / eye width (R = her right brow, L = her left):",
       "trace 0.68 / 0.68 | v7 front 0.70 / 0.70, 3/4 0.70 / 0.68, expr1 0.69 / 0.72, expr2 0.70 / 0.71, lineup 0.69 / 0.71 (v6B: 0.66-0.70)",
       "Expressive panels (sing, sing loud, laugh, determined) keep v6B's fitted brow positions. Profile view: not changed (no face landmarks).",
       "v7 = v6B outline smoothed into a clean brow (rounded head, tapered tail; her right straight, her left slight arch), hair mid-tone fill,",
       "fine directional strokes, 1-px anti-aliased edge (no halo); hair strands re-layered on top (the brow tails run under the hair)."]
exec(open("/home/jade/Documents/vibesong/tools/sprites/v6_review.py").read())
