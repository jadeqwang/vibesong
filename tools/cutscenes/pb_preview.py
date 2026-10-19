"""Pass B paper: 540p preview of a slot clip with the song under it (for checking lip sync by ear).
    .venv/bin/python tools/cutscenes/pb_preview.py SLOT.mp4 IN OUT.mp4 [PRE=0] [POST=0]
The slot clip's frame k = song time IN + k/30. PRE/POST > 0 pad with the clip's first/last frame (held) so the ear gets context."""
import sys, subprocess
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
SONG = "/home/jade/Documents/vibesong/engine/out/cache/song.wav"
slot, t0, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
pre = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0; post = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0
import re
n = int(re.findall(r'frame=\s*(\d+)', subprocess.run([FF, '-stats', '-i', slot, '-map', '0:v:0', '-f', 'null', '-'], capture_output=True, text=True).stderr)[-1])
dur = n / 30
vf = f"scale=960:540:flags=lanczos,tpad=start_duration={pre}:start_mode=clone:stop_duration={post}:stop_mode=clone"
subprocess.run([FF, '-v', 'error', '-y', '-i', slot, '-ss', f'{t0 - pre:.4f}', '-t', f'{dur + pre + post:.4f}', '-i', SONG,
                '-vf', vf, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30',
                '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out], check=True)
print(out, n, 'frames', f'{t0 - pre:.3f} -> {t0 + dur + post:.3f}')
