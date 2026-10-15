"""Portrait fallback as a paper card: the portrait slot clip mounted on a cream sketchbook page with a soft drop shadow,
centred on a coloured-pencil dusk background. python tools/cutscenes/card.py IN_PORTRAIT_SLOT.mp4 OUT.mp4"""
import sys, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFilter
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
src, out = sys.argv[1], sys.argv[2]
raw = Image.open("/home/jade/Documents/vibesong/media/cutscenes/_work/r720/outpaint_raw.png").convert("RGB")
L = raw.crop((0, 0, 800, raw.height))
bg = Image.new("RGB", (1600, raw.height)); bg.paste(L, (0, 0)); bg.paste(L.transpose(Image.FLIP_LEFT_RIGHT), (800, 0))
bg = bg.resize((1920, 1080), Image.LANCZOS)
ch = 880; cw = round(ch * 480 / 854); cw += cw % 2; m = 26
pw, ph = cw + 2 * m, ch + 2 * m; px, py = (1920 - pw) // 2, (1080 - ph) // 2
sh = Image.new("L", (1920, 1080), 0); ImageDraw.Draw(sh).rectangle((px + 12, py + 16, px + pw + 12, py + ph + 16), fill=95)
sh = sh.filter(ImageFilter.GaussianBlur(18))
bg = Image.composite(Image.new("RGB", bg.size, (60, 45, 60)), bg, sh)
page = Image.new("RGB", (pw, ph), (248, 243, 231)); a = np.asarray(page).astype(float)
a += np.random.default_rng(3).normal(0, 2.2, a.shape)            # paper grain
page = Image.fromarray(a.clip(0, 255).astype(np.uint8)); d = ImageDraw.Draw(page)
d.rectangle((m - 2, m - 2, m + cw + 1, m + ch + 1), outline=(150, 140, 130), width=2)   # pencil frame line round the drawing
bg.paste(page, (px, py)); bgp = out[:-4] + "_bg.png"; bg.save(bgp)
subprocess.run([FF, "-v", "error", "-y", "-loop", "1", "-i", bgp, "-i", src, "-filter_complex",
                f"[1:v]scale={cw}:{ch}:flags=lanczos,setsar=1[c];[0:v][c]overlay={px + m}:{py + m}:shortest=1,fps=30,format=yuv420p[v]",
                "-map", "[v]", "-r", "30", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-movflags", "+faststart", "-an", out], check=True)
print(out)
