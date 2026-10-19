# pre-battle half-bar sheet: python tools/pb_sheet.py <mp4> <from> <to> <out.jpg>  (frame index = round((t - from) * 30))
import sys, json, subprocess, os, tempfile, imageio_ffmpeg
from PIL import Image, ImageDraw
mp4, t0, t1, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
beats = json.load(open(os.path.join(os.path.dirname(__file__), '../../analysis/timing.json')))['beat_grid']['beats']
beats = [b if isinstance(b, float) else b['t'] for b in beats]
i0 = min(range(len(beats)), key=lambda i: abs(beats[i] - 94.204))      # bar 57 downbeat
hb = [beats[i] for i in range(len(beats)) if (i - i0) % 2 == 0 and t0 <= beats[i] < t1]
d = tempfile.mkdtemp(); ff = imageio_ffmpeg.get_ffmpeg_exe()
subprocess.run([ff, '-v', 'error', '-i', mp4, os.path.join(d, 'f_%05d.png')], check=True)
w = 480; ims = []
for t in hb:
    k = round((t - t0) * 30) + 1; p = os.path.join(d, 'f_%05d.png' % k)
    if os.path.exists(p): ims.append((t, Image.open(p).convert('RGB')))
h = int(ims[0][1].height * w / ims[0][1].width); cols = 6; rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * w, rows * (h + 16)), (20, 20, 20)); D = ImageDraw.Draw(S)
for n, (t, im) in enumerate(ims):
    x = (n % cols) * w; y = (n // cols) * (h + 16); S.paste(im.resize((w, h), Image.LANCZOS), (x, y + 16)); D.text((x + 3, y + 2), '%.3fs' % t, fill=(255, 255, 0))
S.save(out, quality=88); subprocess.run(['rm', '-rf', d]); print('wrote', out, len(ims), 'frames')
