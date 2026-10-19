"""Pass B card 05: the Seedance takes turn the small pale-blue chest dot into a second 1420 MHz patch (canon: ONE patch, on the left
sleeve band; a small pale-blue dot on the chest). Put the approved still's chest back, frame by frame: a feathered disc of the still
(resized to the take) pasted at the tracked torso offset, gain-matched to the frame's jacket white.
    $OSPY tools/cutscenes/pb_dotfix.py TAKE.mp4 STILL_480.png CX CY R|RX,RY OUT.mp4   (card 03 has the same fault: a 1420 MHz label on the chest)"""
import sys, subprocess, numpy as np, cv2
take, still, cx, cy, out = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[6]
RX, RY = ([int(v) for v in sys.argv[5].split(',')] * 2)[:2]; R = RX   # R or RX,RY (ellipse)
FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
S = cv2.imread(still).astype(np.float32)
cap = cv2.VideoCapture(take); fps = cap.get(cv2.CAP_PROP_FPS); F = []
while True:
    ok, f = cap.read()
    if not ok: break
    F.append(f)
H, W = F[0].shape[:2]
tx0, ty0, tx1, ty1 = cx - 150, cy + 15, cx + 90, cy + 60          # template: the orange chest band + zipper below the dot
tpl = cv2.cvtColor(S[ty0:ty1, tx0:tx1].astype(np.uint8), cv2.COLOR_BGR2GRAY)
yy, xx = np.mgrid[0:H, 0:W]
p = subprocess.Popen([FF, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                      "-c:v", "libx264", "-crf", "10", "-preset", "slow", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
shifts = []
for f in F:
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY); m = 12
    reg = g[ty0 - m:ty1 + m, tx0 - m:tx1 + m]
    r = cv2.matchTemplate(reg, tpl, cv2.TM_CCOEFF_NORMED); _, _, _, loc = cv2.minMaxLoc(r)
    dx, dy = loc[0] - m, loc[1] - m; shifts.append((dx, dy))
    Ms = np.float32([[1, 0, dx], [0, 1, dy]]); Sw = cv2.warpAffine(S, Ms, (W, H), borderMode=cv2.BORDER_REFLECT)
    e = np.sqrt(((xx - cx - dx) / RX) ** 2 + ((yy - cy - dy) / RY) ** 2)
    ring = (e > 1.15) & (e < 1.8) & (Sw.sum(2) > 600)          # jacket white only (not the band / zipper)
    gain = (f[ring].astype(np.float32).mean(0) + 1) / (Sw[ring].mean(0) + 1)
    a = np.clip((1.12 - e) * min(RX, RY) / 5, 0, 1)[..., None]
    o = f.astype(np.float32) * (1 - a) + Sw * gain * a
    p.stdin.write(o.clip(0, 255).astype(np.uint8).tobytes())
p.stdin.close(); p.wait()
s = np.array(shifts); print(out, 'shift range dx', s[:, 0].min(), s[:, 0].max(), 'dy', s[:, 1].min(), s[:, 1].max())
