"""Charlie / Ricky listening first frames: nano-banana-pro edits of chest-up crops of the v9 paper lineup."""
import sys
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/gen"); import cf
O = "media/cutscenes/_work/ff/"
WHO = {"charlie": "the young man with curly dark hair, a beige flat newsboy cap, a charcoal tee and an acoustic guitar on a brown strap",
       "ricky": "the young man with short black hair, a blue and white vertical-striped shirt with rolled sleeves and a natural-wood electric guitar on a navy strap"}
n = sys.argv[1]
P = (f"Edit the FIRST image, a coloured-pencil drawing of {WHO[n]}. Keep him EXACTLY as drawn: the same face, eyes, hair, "
     "clothes, guitar and strap, the same position and size in the frame, the same pencil lines; do not redraw, move, shrink, "
     "beautify or restyle him. Chest-up framing stays as it is. Replace only the plain cream background with a soft dusk sky "
     "drawn in coloured pencil on cream paper: lavender-violet at the top, warm peach and pink lower down, loose diagonal "
     "hatching, like the sky in the SECOND image, and let a soft warm dusk light fall on him from the side. Remove any stray "
     "piece of another person or instrument at the frame edges. Same drawing style as the first image: graphite line art and "
     "coloured pencil on cream paper. No text, no letters, no other people.")
print(cf.generate("google/nano-banana-pro", {"prompt": P, "image_input": [f"file:{O}canvas_{n}.png",
    "file:keyframes/concepts/k10_bridge_paper.png"], "aspect_ratio": "16:9", "image_size": "2K", "output_format": "png"},
    O + f"ff_{n}{sys.argv[2] if len(sys.argv) > 2 else ''}.png", tag="cut_ff_band"))
