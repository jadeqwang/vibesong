"""Cutscene finishing for the bridge PAPER slots.

  python tools/cutscenes/compose.py lagopts TAKE.mp4 S0 LAG1,LAG2,LAG3 OUT.mp4   # 3 timing offsets side by side + song audio
  python tools/cutscenes/compose.py slot TAKE.mp4 S0 LAG IN OUT OUT.mp4           # exact slot clip, 30 fps, no audio
  python tools/cutscenes/compose.py veo CLIP.mp4 SKIP DUR OUT.mp4                 # trim Veo ease-in, conform to 30 fps
  python tools/cutscenes/compose.py review JADE.mp4 CHARLIE.mp4 RICKY.mp4 OUT.mp4 # whole bridge slot run, song audio, + sheet
clip time = song time - S0 + LAG (S0 = audio-reference start in song time).
"""
import sys, subprocess, os
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
SONG = "/home/jade/Documents/vibesong/work/song.wav"
J_IN, J_OUT, L_OUT = 125.769, 128.180, 129.385
ENC = ["-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow", "-movflags", "+faststart"]
def run(c): subprocess.run([FF, "-v", "error", "-y"] + c, check=True)
def ass(path, labels, W, H):
    s = (f"[Script Info]\nScriptType: v4.00+\nPlayResX: {W}\nPlayResY: {H}\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, "
         "OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV\n"
         "Style: L,DejaVu Sans,26,&H00FFFFFF,&H00000000,&H80000000,1,0,1,2,0,7,10,10,10\n\n[Events]\n"
         "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
    for x, y, t in labels: s += f"Dialogue: 0,0:00:00.00,9:00:00.00,L,,0,0,0,,{{\\pos({x},{y})}}{t}\n"
    open(path, "w").write(s)
def seg(take, s0, lag, t0, t1):
    """input args for the take so that output t=0 shows song time t0 (pads frames with the first frame if before clip start)."""
    ct0 = t0 - s0 + lag
    return (["-ss", f"{ct0:.4f}", "-i", take], "") if ct0 >= 0 else (["-i", take], f"tpad=start_duration={-ct0:.4f}:start_mode=clone,")
cmd = sys.argv[1]
if cmd == "lagopts":
    take, s0, lags, out = sys.argv[2], float(sys.argv[3]), [float(x) for x in sys.argv[4].split(",")], sys.argv[5]
    t0, t1 = J_IN - 0.6, J_OUT + 0.6; dur = t1 - t0
    ins, fl = [], []
    for i, L in enumerate(lags):
        a, pad = seg(take, s0, L, t0, t1); ins += a
        fl.append(f"[{i}:v]{pad}fps=30,scale=640:720:force_original_aspect_ratio=decrease:flags=lanczos,pad=640:720:(ow-iw)/2:(oh-ih)/2:color=0xF7F1E4,setsar=1,trim=duration={dur:.4f},setpts=PTS-STARTPTS[v{i}]")
    ins += ["-ss", f"{t0:.4f}", "-t", f"{dur:.4f}", "-i", SONG]
    a = out[:-4] + ".ass"; ass(a, [(10 + i * 640, 8, f"{'ABC'[i]}  lag {L:+.2f} s") for i, L in enumerate(lags)] +
                           [(10, 680, f"slot {J_IN}-{J_OUT} = 0.6-{0.6 + J_OUT - J_IN:.2f} s here")], 1920, 720)
    fc = ";".join(fl) + f";[v0][v1][v2]hstack=3,ass={a},fps=30[v]"
    run(ins + ["-filter_complex", fc, "-map", "[v]", "-map", "3:a", "-t", f"{dur:.4f}"] + ENC + ["-c:a", "aac", "-b:a", "192k", out])
elif cmd == "slot":
    take, s0, lag, t0, t1, out = sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), float(sys.argv[6]), sys.argv[7]
    a, pad = seg(take, s0, lag, t0, t1)
    run(a + ["-vf", f"{pad}fps=30,scale=-2:1080:flags=lanczos,setsar=1", "-frames:v", str(round((t1 - t0) * 30)), "-an"] + ENC + [out])
elif cmd == "veo":
    clip, skip, dur, out = sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
    run(["-ss", f"{skip:.4f}", "-i", clip, "-vf", "fps=30,setsar=1", "-frames:v", str(round(dur * 30)), "-an"] + ENC + [out])
elif cmd == "review":
    jade, ch, ri, out = sys.argv[2:6]
    d1, d2 = J_OUT - J_IN, L_OUT - J_OUT
    fc = (f"[0:v]scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0xF7F1E4,setsar=1,trim=duration={d1:.4f},setpts=PTS-STARTPTS[j];"
          f"[1:v]scale=1920:1080,crop=960:1080:480:0,setsar=1,trim=duration={d2:.4f},setpts=PTS-STARTPTS[c];"
          f"[2:v]scale=1920:1080,crop=960:1080:480:0,setsar=1,trim=duration={d2:.4f},setpts=PTS-STARTPTS[r];"
          f"[c][r]hstack=2[cr];[j][cr]concat=n=2:v=1:a=0,fps=30[v]")
    run(["-i", jade, "-i", ch, "-i", ri, "-ss", f"{J_IN:.4f}", "-t", f"{L_OUT - J_IN:.4f}", "-i", SONG, "-filter_complex", fc,
         "-map", "[v]", "-map", "3:a"] + ENC + ["-c:a", "aac", "-b:a", "192k", "-shortest", out])
    run(["-i", out, "-vf", "fps=4,scale=480:-2,tile=5x3", "-frames:v", "1", out[:-4] + "_sheet.jpg"])
print("ok", sys.argv[-1])
