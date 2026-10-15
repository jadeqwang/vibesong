"""Tiny wrapper: g.py MODEL OUT TAG PROMPT_FILE [ref ...] [--k=v json]  (art-department generations, cap via VIBESONG_CAP)."""
import sys, os, json
ROOT = "/home/jade/Documents/vibesong"
sys.path.insert(0, ROOT + "/tools/gen"); os.chdir(ROOT)
import cf
model, out, tag, pf = sys.argv[1:5]
refs = [a for a in sys.argv[5:] if not a.startswith("--")]
extra = {a[2:].split("=", 1)[0]: json.loads(a[2:].split("=", 1)[1]) for a in sys.argv[5:] if a.startswith("--")}
prompt = open(pf).read().strip()
if model.startswith("openai/"):
    inp = {"prompt": prompt, "size": "1536x1024", "quality": "high"}
    if refs: inp["images"] = ["file:" + r for r in refs]
elif model.startswith("google/"):
    inp = {"prompt": prompt, "aspect_ratio": "16:9", "image_size": "2K"}
    if refs: inp["image_input"] = ["file:" + r for r in refs]
inp.update(extra)
print(cf.generate(model, inp, out, tag=tag))
