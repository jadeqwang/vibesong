"""Pass B paper: one nano-banana-pro edit (logged in media/genlog.jsonl via tools/gen/cf.py).
    $PY tools/cutscenes/pb_nbp.py PROMPT.txt OUT.png TAG ASPECT IMG1 [IMG2 ...]
PY = ~/Documents/1-music-shipped/moongazing/.venv/bin/python. Images: drawings / approved paper sheets only, never photos."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "gen"))
import cf
pf, out, tag, ar, *imgs = sys.argv[1:]
for i in imgs:
    assert "rewind-take-two" not in i and "selfie" not in i and "irl" not in i, "never send a photo to a model"
inp = {"prompt": open(pf).read(), "aspect_ratio": ar, "image_size": "2K", "image_input": ["file:" + i for i in imgs]}
print(cf.generate("google/nano-banana-pro", inp, out, tag=tag))
