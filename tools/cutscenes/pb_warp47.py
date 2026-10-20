"""v4.7 (v47_cards): COPY of pb_warp03.py for the v4.7 card-03 take v47_03_sd25_cur1 (upscaled; pb_slot base S0 19.85, lag -0.01). Original doc: v4.4 (Jade 10-19): card 03 at +0 on 'because' and +6 for the rest of the line, joined by a smooth time-warp (no jump, no held frame).
    CV=~/Documents/1-music-shipped/orbital-sunrise-video/video/out/.venv/bin/python   (has cv2)
    $CV tools/cutscenes/pb_warp03.py TA TB OUT.mp4 [KA KB]
Shift K(t) (frames later picture, as in paper_0020_v43_shift+K.mp4) goes KA (0) -> KB (6) over song [TA, TB] with a raised-cosine speed dip:
K = KA + (KB-KA) * (x - sin(2 pi x) / 2 pi), x = (t - TA) / (TB - TA); source speed = 1 - dK/dt / 30 (min 1 - 2 (KB-KA) / N, N = ramp frames).
Frames before TA are copied from the +KA slot clip, frames after TB from the +KB slot clip (byte-for-byte the approved pixels); the ramp frames
are optical-flow interpolated (OpenCV DIS, both directions) from the upscaled take v43_03_c4_up_3498dcc010.mp4 (24 fps; file t = song t -
19.808333 - 0.05 - K/30, the pb_slot base of v4.3). Slot: frame k = song 20.1667 + k/30, 108 frames, 1920x1080, no audio."""
import sys, subprocess, math, numpy as np, cv2
ROOT = "/home/jade/Documents/vibesong/"
FF = ROOT + ".venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
UP = ROOT + "media/gen/v47_03_cur1_up_76dbbfa5ca.mp4"; UW, UH = 1922, 1080
SLOT = ROOT + "media/cutscenes/paper_0020/paper_0020_v47_cur1_shift%+d.mp4"
IN, N, S0, LAG = 20.1667, 108, 19.85, -0.01

def decode(path, w, h):
    raw = subprocess.run([FF, "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)

def kshift(t, ta, tb, ka, kb):
    if t <= ta: return ka
    if t >= tb: return kb
    x = (t - ta) / (tb - ta); return ka + (kb - ka) * (x - math.sin(2 * math.pi * x) / (2 * math.pi))

def flow_interp(A, B, a):
    s = 0.5; ga = cv2.cvtColor(cv2.resize(A, None, fx=s, fy=s, interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2GRAY)
    gb = cv2.cvtColor(cv2.resize(B, None, fx=s, fy=s, interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2GRAY)
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    fab = cv2.resize(dis.calc(ga, gb, None), (A.shape[1], A.shape[0])) / s
    fba = cv2.resize(dis.calc(gb, ga, None), (A.shape[1], A.shape[0])) / s
    h, w = A.shape[:2]; gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    # intermediate pixel y: A at y - a*F_ab(y) (approx. with -a*F_ab ~ +a*F_ba), B at y - (1-a)*F_ba(y)
    wa = cv2.remap(A, gx + a * fba[..., 0], gy + a * fba[..., 1], cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    wb = cv2.remap(B, gx + (1 - a) * fab[..., 0], gy + (1 - a) * fab[..., 1], cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return np.clip((1 - a) * wa.astype(np.float32) + a * wb.astype(np.float32) + 0.5, 0, 255).astype(np.uint8)

def main():
    ta, tb, out = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
    ka, kb = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (0, 6)
    va, vb = decode(SLOT % ka, 1920, 1080), decode(SLOT % kb, 1920, 1080); up = decode(UP, UW, UH)
    assert len(va) == N and len(vb) == N, (len(va), len(vb))
    enc = subprocess.Popen([FF, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1920x1080", "-r", "30", "-i", "-",
                            "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "14", "-preset", "slow", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    log = []
    for k in range(N):
        t = IN + k / 30; K = kshift(t, ta, tb, ka, kb)
        if t <= ta: fr, src = va[k], f"+{ka} clip"
        elif t >= tb: fr, src = vb[k], f"+{kb} clip"
        else:
            u = t - S0 + LAG - K / 30; f = u * 24; i0 = int(math.floor(f)); a = f - i0
            A, B = up[i0], up[min(i0 + 1, len(up) - 1)]
            fr = A if a < 1e-3 else flow_interp(A, B, a)
            fr = cv2.resize(fr, (1920, 1080), interpolation=cv2.INTER_LANCZOS4); src = f"flow {i0}+{a:.2f}"
        log.append(f"{k:3d} t={t:.4f} K={K:.2f} {src}")
        enc.stdin.write(np.ascontiguousarray(fr).tobytes())
    enc.stdin.close(); enc.wait()
    open(out + ".txt", "w").write(f"ramp {ta}-{tb} K {ka}->{kb}\n" + "\n".join(log) + "\n"); print(out)

if __name__ == "__main__":
    main()
