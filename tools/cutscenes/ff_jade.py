"""Jade bridge first frames: nano-banana-pro edits that start from the v9 expression panels (canvas_{A,B}.png)."""
import sys, os
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/gen"); import cf
O = "media/cutscenes/_work/ff/"
KEEP = ("Keep her head, face, glasses-free eyes, hair, bun, the two pencils and the orange headphones EXACTLY as drawn in the first "
        "image: same position, same size, same pencil lines. Do not redraw, move, shrink, slim, beautify, age or restyle her face; "
        "no makeup. She has a large head, a high broad forehead with the centre-parted hairline high above her brows, a wide "
        "heart-shaped face with a tapering chin and two slightly different eyebrows; keep all of that exactly.")
BODY = ("Continue her body below the shoulders as a centred chest-up portrait: the white cropped racer jacket exactly like the "
        "THIRD image (band collar with a snap throat-tab, snap epaulets on the shoulders, zip front open over a black crop top, an "
        "orange stripe across the chest and sleeves, ONE small pale-blue dot on her left chest), the orange headphones resting "
        "around her neck: the big over-ear headphones keep exactly the size and position drawn in the first image, both ear cups "
        "fully visible and as wide as in the first image, never shrunk or hidden.")
SHEET = ("The sheet is thin cream drawing paper: on the side facing us a small coloured-pencil drawing of a dusk landscape (soft "
         "hills, a winding river, wildflowers, a setting sun) like the sheet in the SECOND image, filling the sheet. There is NO "
         "writing, no letters, no code and no characters anywhere on the sheet or in the picture.")
BG = ("Replace the plain cream around her with a soft dusk sky in coloured pencil on cream paper: lavender-violet at the top, warm "
      "peach and pink lower down, loose diagonal hatching, like the SECOND image's sky; soft warm dusk light falls on her.")
HAIR = ("Her hair stays UP in the bun with both pencils stuck through it, crossing in an X hidden inside the bun: yellow bodies, "
        "one blue eraser cap, one pink eraser cap, exactly as in the first image.")
STYLE = ("Same drawing style as the first image: graphite line art and coloured pencil on cream paper. No text, letters or "
         "captions anywhere. No railing, no other people.")
P = {
 "A": ("Edit the FIRST image, a coloured-pencil drawing of a young woman cut off at the shoulders, into a finished 16:9 "
       "coloured-pencil illustration. " + KEEP + " " + BODY + " With both hands she holds up a sheet of paper in front of her, "
       "square to the camera, flat and facing the viewer, its top edge just below the headphones at her collarbones, never "
       "covering her face, chin or headphones; her hands hold its lower corners near the bottom of the frame. " + SHEET + " " + BG +
       " " + HAIR + " " + STYLE),
 "C": ("Edit the FIRST image, a coloured-pencil drawing of a young woman cut off at the shoulders, into a finished 16:9 "
       "coloured-pencil illustration. " + KEEP + " " + BODY + " With both hands she holds a landscape-format sheet of paper "
       "horizontally centred in front of her body, directly below the headphones, covering her lower chest and stomach, square "
       "to the camera, flat and facing the viewer; her hands hold its two lower corners near the bottom of the frame; her "
       "face, chin, neck and both headphone ear cups stay fully visible above it. " + SHEET + " " + BG + " " + HAIR + " " + STYLE),
 "B": ("Edit the FIRST image, a coloured-pencil drawing of a young woman singing softly with her eyes closed, cut off at the "
       "shoulders, into a finished 16:9 coloured-pencil illustration. Her head stays exactly where it is and exactly as large as "
       "it is in the first image; do not move, resize or re-pose it. " + KEEP + " Keep her soft singing expression, closed eyes "
       "and the slight tilt of her head. " + BODY + " With both hands she holds up a sheet of paper in front of her, square to "
       "the camera, flat and facing the viewer, its top edge just below the headphones at her collarbones, never covering her "
       "face, chin or headphones; her hands hold its lower corners near the bottom of the frame. " + SHEET + " " + BG + " " +
       HAIR + " " + STYLE),
}
v = sys.argv[1]; out = O + f"ff_{v}{sys.argv[2] if len(sys.argv) > 2 else ''}.png"
paths = cf.generate("google/nano-banana-pro", {"prompt": P[v], "image_input": [f"file:{O}canvas_{'A' if v == 'C' else v}.png",
    "file:keyframes/concepts/k10_bridge_paper.png", "file:assets/sheets/paper/paper_jade_turnaround.png"],
    "aspect_ratio": "16:9", "image_size": "2K", "output_format": "png"}, out, tag="cut_ff_jade")
print(paths)
