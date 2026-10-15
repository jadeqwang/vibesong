"""Repair ff_A1: remove the model's garbled code text and restore full-size headphones (edit, then masked composite below the chin only)."""
import sys
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/gen"); import cf
O = "media/cutscenes/_work/ff/"
P = ("Edit only two things in the FIRST image and keep everything else exactly the same, pixel for pixel: (1) remove all the "
     "writing, letters and code on the sheet of paper she holds, and continue the coloured-pencil landscape drawing (dusk sky, "
     "hills) in that area so the sheet shows only the drawing; (2) the orange over-ear headphones around her neck: draw them as "
     "large as in the SECOND image, both ear cups fully visible resting on her collarbones either side of the jacket collar. "
     "Do not change her face, hair, pencils, hands, jacket, the sheet's shape or the sky. No text anywhere.")
print(cf.generate("google/nano-banana-pro", {"prompt": P, "image_input": [f"file:{O}ff_A1.png", f"file:{O}canvas_A.png"],
    "aspect_ratio": "16:9", "image_size": "2K", "output_format": "png"}, O + "ff_A1fix_raw.png", tag="cut_ff_jade"))
