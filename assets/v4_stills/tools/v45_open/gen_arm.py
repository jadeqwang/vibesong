#!/usr/bin/env python3
"""v45_open: NBP edit of the 2011 page crop under Charlie's strumming arm -> the guitar without the forearm/hand.
Input  assets/v4_stills/work/v45_open/arm_in.png  (512x512 crop of work/passB_oc/plate01_clean_a.png at (746,860))
Output assets/v4_stills/work/v45_open/arm_gen_<v>.png   usage: .venv/bin/python assets/v4_stills/tools/v45_open/gen_arm.py a"""
import sys; sys.path.insert(0, '/home/jade/Documents/vibesong/tools/gen'); import cf
v = sys.argv[1] if len(sys.argv) > 1 else 'a'
P = ("Edit the attached image (a graphite pencil sketch of a young man seated, playing an acoustic guitar). "
     "REMOVE his RIGHT FOREARM and RIGHT HAND: the arm that lies diagonally across the top of the guitar body, from the elbow "
     "(on the guitar's upper edge at the left) down to the fingers resting near the round sound hole. Where they were, draw the "
     "guitar that is underneath, in exactly the same light graphite pencil style and line weight: the upper bout outline, the pale "
     "wood top with the same faint horizontal grain hatching, the round sound hole with its ring, the six thin strings running in "
     "straight parallel lines from the bridge across the sound hole and up the neck, and the dark pickguard. "
     "Keep EVERYTHING ELSE pixel-identical, in exactly the same place and scale: his upper arm, shoulder and T-shirt, face and hair, "
     "the left hand on the neck, the guitar neck and frets, the bridge with its pins, the notebook, the stool, the legs, the string "
     "lights and the cream paper. Graphite only, no colour, no new objects, no text.")
out = cf.generate('google/nano-banana-pro', {'prompt': P, 'aspect_ratio': '1:1', 'image_size': '1K',
                  'image_input': ['file:assets/v4_stills/work/v45_open/arm_in.png']},
                  f'assets/v4_stills/work/v45_open/arm_gen_{v}.png', tag=f'v45_open_arm_{v}')
print(out)
