"""act5 image gen wrapper: python img.py TAG OUT PROMPT_FILE [ref ...] [--size=2K]  (tag gets 'act5_' prefix)"""
import sys, os, json
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/gen")
import cf
args = [a for a in sys.argv[1:] if not a.startswith("--")]
opts = dict(a[2:].split("=", 1) for a in sys.argv[1:] if a.startswith("--"))
tag, out, pf, *refs = args
prompt = open(pf).read().strip()
inp = {"prompt": prompt, "aspect_ratio": opts.get("ar", "16:9"), "image_size": opts.get("size", "2K"), "output_format": "png"}
if refs: inp["image_input"] = [f"file:{os.path.abspath(p)}" for p in refs]
print(cf.generate("google/nano-banana-pro", inp, out, tag="act5_" + tag))
