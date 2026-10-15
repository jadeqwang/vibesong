"""conform.py CLIP NAME [--fps30] [--ss S] [--t D]: (optionally motion-interpolate 24->30 fps), extract JPEG frame seqs
to media/act5/frames/NAME/{1080,540}/f_00000.jpg + index.json {n, fps}."""
import sys, os, json, subprocess, glob, shutil
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
a = [x for x in sys.argv[1:] if not x.startswith("--")]; o = dict((x[2:].split("=") + [True])[:2] for x in sys.argv[1:] if x.startswith("--"))
clip, name = a
root = f"/home/jade/Documents/vibesong/media/act5/frames/{name}"
pre = []
if "ss" in o: pre += ["-ss", str(o["ss"])]
post = ["-t", str(o["t"])] if "t" in o else []
vf = "minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" if "fps30" in o else "null"
if "dedup" in o:  # drop duplicated frames (Seedance repeats ~1 in 5) and re-time evenly before interpolating
    drop = [int(x) for x in str(o["drop"]).split(",")]
    sel = "+".join(f"eq(n\\,{d})" for d in drop)
    vf = f"select='not({sel})',setpts=N*{float(o['dedup'])}/TB," + vf
fps = 30 if "fps30" in o else 24
for h in (1080, 540):
    d = f"{root}/{h}"; shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    sc = "" if h == 1080 else ",scale=960:540:flags=lanczos"
    subprocess.run([FF, "-v", "error", "-y", *pre, "-i", clip, *post, "-vf", vf + sc, "-q:v", "2" if h == 1080 else "3", "-start_number", "0", f"{d}/f_%05d.jpg"], check=True)
    n = len(glob.glob(f"{d}/f_*.jpg")); json.dump({"n": n, "fps": fps, "src": os.path.basename(clip)}, open(f"{d}/index.json", "w"))
    print(name, h, n, "frames @", fps)
