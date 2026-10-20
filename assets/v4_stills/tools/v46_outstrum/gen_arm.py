#!/usr/bin/env python3
"""v46_outstrum: NBP edit of the outro spread's left page (the 2011 graphite page, spread_v1 art) under Charlie's strumming arm
-> the guitar without the forearm/hand (used ONLY inside the traced forearm footprint, build_strum.py).
Input  assets/v4_stills/work/v46_outstrum/arm_in.png  (512x512 crop of media/act5/tex/spread_full_spreadR_v45r2.jpg at (520,1300))
Output assets/v4_stills/work/v46_outstrum/arm_gen_<v>.png   usage: .venv/bin/python assets/v4_stills/tools/v46_outstrum/gen_arm.py a"""
import sys; sys.path.insert(0, '/home/jade/Documents/vibesong/tools/gen'); import cf
from PIL import Image
R = '/home/jade/Documents/vibesong/'; WK = R + 'assets/v4_stills/work/v46_outstrum/'
CX, CY, CN = 520, 1300, 512
v = sys.argv[1] if len(sys.argv) > 1 else 'a'
Image.open(R + 'media/act5/tex/spread_full_spreadR_v45r2.jpg').convert('RGB').crop((CX, CY, CX + CN, CY + CN)).save(WK + 'arm_in.png')
P = ("Edit the attached image (a graphite pencil sketch of a young man seated, playing an acoustic guitar). "
     "REMOVE his RIGHT FOREARM and RIGHT HAND: the bare arm that lies diagonally across the top of the guitar body, from the elbow "
     "(at the far left, on the guitar's upper edge) down to the fingers resting on the round sound hole. Where they were, draw the "
     "guitar that is underneath, in exactly the same graphite pencil style and line weight: the upper bout's dark outline continuing "
     "smoothly, the pale wood top with the same faint horizontal grain hatching, the upper end of the dark bridge with its pins, "
     "the round sound hole with its ring, and the six thin strings running in straight parallel lines from the bridge across the "
     "sound hole and up the neck. "
     "Keep EVERYTHING ELSE pixel-identical, in exactly the same place and scale: his upper arm, shoulder and T-shirt, his face, "
     "the left hand on the neck, the guitar neck and frets, the dark pickguard, the notebook, the pencil, the stool, the legs and the "
     "cream paper. Graphite only, no colour, no new objects, no text.")
out = cf.generate('google/nano-banana-pro', {'prompt': P, 'aspect_ratio': '1:1', 'image_size': '1K',
                  'image_input': ['file:assets/v4_stills/work/v46_outstrum/arm_in.png']},
                  WK + f'arm_gen_{v}.png', tag=f'v46_outstrum_arm_{v}')
print(out)
