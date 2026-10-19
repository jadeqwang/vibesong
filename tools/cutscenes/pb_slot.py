"""Pass B paper cards: exact slot clip from a take (30 fps, 1920x1080, no audio), with the take's measured lag baked in.
    python tools/cutscenes/pb_slot.py TAKE.mp4 S0 LAG IN OUT OUT.mp4
clip time = song time - S0 + LAG; output frame k shows song time IN + k/30; frames = round((OUT - IN) * 30)."""
import sys, subprocess
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
take, s0, lag, t0, t1, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), sys.argv[6]
ct0 = t0 - s0 + lag; assert ct0 > -0.05, ct0          # (M3) up to ~1 take frame before the take/segment start is OK: its first frame is held
n = round((t1 - t0) * 30)
# (M3) frame-exact: shift the take's timestamps by -ct0 and resample at 30 fps from 0 (an input -ss snapped up to one frame early)
subprocess.run([FF, "-v", "error", "-y", "-i", take, "-vf", f"setpts=PTS-{ct0:.4f}/TB,fps=30:start_time=0,scale=1920:1080:flags=lanczos,setsar=1",
                "-frames:v", str(n), "-an", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "14", "-preset", "slow",
                "-movflags", "+faststart", out], check=True)
print(out, n, 'frames, take from', round(ct0, 4), 's')
