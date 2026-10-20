"""v4.4 spread: conform a Seedance take (24 fps, 9 s from song 186.30) to an engine FrameSeq at 30 fps, real-time:
frame k = clip time k/30 (the engine maps song t -> clip t = t - 186.30 + lag, spread.js LIVE).
    .venv/bin/python tools/cutscenes/pb_spread44_frames.py TAKE.mp4 NAME     -> media/act5/frames/NAME/{1080,540}/f_%05d.jpg + index.json"""
import sys, os, json, subprocess
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
take, name = sys.argv[1], sys.argv[2]
for h, w in [(1080, 1920), (540, 960)]:
    d = f"/home/jade/Documents/vibesong/media/act5/frames/{name}/{h}"; os.makedirs(d, exist_ok=True)
    subprocess.run([FF, "-v", "error", "-y", "-i", take, "-vf", f"fps=30,scale={w}:{h}:flags=lanczos", "-q:v", "2", "-start_number", "0", f"{d}/f_%05d.jpg"], check=True)
    n = len([f for f in os.listdir(d) if f.startswith("f_")])
    json.dump({"n": n, "fps": 30, "t0": 186.30, "src": os.path.basename(take) + " (Seedance 2.5, vocal stem from 186.30; fps=30 lanczos)"}, open(f"{d}/index.json", "w"))
    print(d, n)
