"""Charlie / Ricky PLAYING first frames: nano-banana-pro edits of waist-up crops of the v9 paper lineup, dusk like ff_<n>1."""
import sys
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/gen"); import cf
O = "media/cutscenes/_work/play/"
WHO = {"charlie": ("the young man with curly dark hair, a beige flat newsboy cap and a charcoal tee, playing his acoustic guitar "
                   "on a brown strap", "his right hand strumming the strings over the sound hole, his left hand fretting a chord on the neck"),
       "ricky": ("the young man with short black hair and a blue and white vertical-striped shirt with rolled sleeves, playing his "
                 "natural-wood Stratocaster-style electric guitar on a navy strap",
                 "his right hand holding a pick over the strings between the pickups, his left hand fretting a chord on the neck")}
n = sys.argv[1]; who, hands = WHO[n]
P = (f"Edit the FIRST image, a coloured-pencil drawing of {who}. Keep him EXACTLY as drawn: the same face, eyes, hair, clothes, "
     f"guitar and strap, the same position and size in the frame, the same pencil lines; do not redraw, move, shrink, beautify "
     f"or restyle him or his face. He is playing: {hands}, both hands clearly on the guitar in a natural playing position. Remove "
     "every other person or instrument at the left and right edges of the frame. Replace the plain cream background with the "
     "same soft dusk sky as the SECOND image: lavender-violet at the top, warm peach and pink lower down, loose diagonal "
     "coloured-pencil hatching on cream paper, with the same soft warm dusk light on him from the side. Same drawing style as the "
     "first image: graphite line art and coloured pencil on cream paper. No text, no letters, no other people.")
print(cf.generate("google/nano-banana-pro", {"prompt": P, "image_input": [f"file:{O}canvas_{n}.png",
    f"file:media/cutscenes/_work/ff/ff_{n}1.png"], "aspect_ratio": "16:9", "image_size": "2K", "output_format": "png"},
    O + f"ff_{n}_play{sys.argv[2] if len(sys.argv) > 2 else '1'}.png", tag="cut_ff_play"))
