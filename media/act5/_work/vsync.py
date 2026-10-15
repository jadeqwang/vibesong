"""vsync.py SPEC OUT.mp4 : run a video spec synchronously through cf.generate (allow_video), tag from spec"""
import sys, json
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/gen")
import cf, gen
s = json.load(open(sys.argv[1])); inp = gen.normalise(s["model"], dict(s["input"]))
if s["model"].startswith("google/veo") and str(inp.get("image_input", "")).startswith("file:"):
    import base64; inp["image_input"] = base64.b64encode(open(inp["image_input"][5:], "rb").read()).decode()
print(cf.generate(s["model"], inp, sys.argv[2], tag=s["tag"] + "_sync", allow_video=True, timeout=900))
