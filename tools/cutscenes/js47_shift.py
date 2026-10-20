"""v4.7 (unit v47_trio): timing variants of the 2:07 bridge card (act4.paper_jade_sing, paper.js CLIPS.jade_sing).
Rebuilds fallback_card_480p_portrait_adv0.10_v11_up.mp4 from the 1.5x upscale of the v11 take (media/gen/pB_bridge_upscale_t1_7d8eb60840.mp4,
24 fps, = take time 0.125 + t, _work/passB/upscale/seg_bridge.txt) with the picture shifted K whole frames LATER (K < 0 = earlier).
K = 0 is the installed card (take from 0.309 s = +0.10 s ahead of the measured lag 0.00); K = +3 ~ back to lag 0.00.
    python3 tools/cutscenes/js47_shift.py K OUT.mp4
Card geometry = tools/cutscenes/card.py (portrait 496x880 at 712,100 on the saved _up_bg.png)."""
import sys, subprocess
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
D = "/home/jade/Documents/vibesong/media/cutscenes/jade_sing_bridge_1/"
UP = "/home/jade/Documents/vibesong/media/gen/pB_bridge_upscale_t1_7d8eb60840.mp4"
K, out = int(sys.argv[1]), sys.argv[2]
N = 72                                     # 125.769 -> 128.180
# (v47) the bg loop runs at 30 fps (card.py let it default to 25 fps, so the installed card drops/repeats ~1 frame in 6: up to 1 frame jitter).
# the installed slot jade_sing_bridge_1_adv0.10_v11_up.mp4 = `-ss 0.184 -i UP, fps=30, scale=-2:1080` (PSNR 45 dB); its card = that slot
# through card.py's geometry (49.6 dB). Same phase here; the shift is whole 30 fps frames: K > 0 clones frame 0 K times, K < 0 drops -K frames.
sh = (f"tpad=start={K}:start_mode=clone," if K > 0 else "") + (f"trim=start_frame={-K},setpts=PTS-STARTPTS," if K < 0 else "")
slot = out[:-4] + "_slot608.mp4"           # step 1 exactly as the installed slot (78 frames so K down to -6 has picture to the end)
subprocess.run([FF, "-v", "error", "-y", "-ss", "0.184", "-i", UP, "-vf", "fps=30,scale=-2:1080:flags=lanczos,setsar=1", "-frames:v", str(N + 6),
                "-an", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "12", "-preset", "slow", slot], check=True)
fc = (f"[1:v]{sh}scale=496:880:flags=lanczos,setsar=1[c];[0:v][c]overlay=712:100:shortest=1,fps=30,format=yuv420p[v]")
subprocess.run([FF, "-v", "error", "-y", "-loop", "1", "-framerate", "30", "-i", D + "fallback_card_480p_portrait_adv0.10_v11_up_bg.png", "-i", slot,
                "-filter_complex", fc, "-map", "[v]", "-frames:v", str(N), "-r", "30", "-c:v", "libx264", "-crf", "16", "-preset", "slow",
                "-movflags", "+faststart", "-an", out], check=True)
import os; os.remove(slot)
print(out, K)
