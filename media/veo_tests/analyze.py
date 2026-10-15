#!/usr/bin/env python3
"""Analyse a test clip: probe, 6-frame contact sheet, first-frame fidelity, composition/shape stability.

Run with the OS venv (has cv2):
  ~/Documents/1-music-shipped/orbital-sunrise-video/video/out/.venv/bin/python media/veo_tests/analyze.py CLIP.mp4 INPUT_STILL [--A]
Writes next to the clip: <name>_sheet.jpg, and for --A: <name>_overlay_raw.jpg (first/last 50/50),
<name>_overlay_aligned.jpg (last warped onto first by a homography, red=first / cyan=last), plus JSON stats.
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np

FF = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"


def probe(path):
    r = subprocess.run([FF, "-hide_banner", "-i", path], capture_output=True, text=True).stderr
    info = {"raw": [l.strip() for l in r.splitlines() if "Stream #" in l or "Duration" in l]}
    cap = cv2.VideoCapture(path)
    info.update(width=int(cap.get(3)), height=int(cap.get(4)), fps=round(cap.get(5), 3), frames=int(cap.get(7)))
    info["duration"] = round(info["frames"] / info["fps"], 3) if info["fps"] else None
    info["has_audio"] = any("Audio:" in l for l in info["raw"])
    return info


def frames(path):
    cap = cv2.VideoCapture(path)
    out = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        out.append(f)
    return out


def sheet(fr, out, fps, n=6, w=640):
    idx = np.linspace(0, len(fr) - 1, n).round().astype(int)
    tiles = []
    for i in idx:
        t = cv2.resize(fr[i], (w, int(w * fr[i].shape[0] / fr[i].shape[1])), interpolation=cv2.INTER_AREA)
        cv2.putText(t, f"f{i} {i/fps:.2f}s", (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        tiles.append(t)
    rows = [np.hstack(tiles[k:k + 3]) for k in range(0, n, 3)]
    cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
    return idx.tolist()


def homog(a, b):
    """Homography mapping b -> a (ORB + RANSAC). Returns H, inlier ratio, n matches."""
    orb = cv2.ORB_create(8000)
    ga, gb = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), cv2.cvtColor(b, cv2.COLOR_BGR2GRAY)
    ka, da = orb.detectAndCompute(ga, None)
    kb, db = orb.detectAndCompute(gb, None)
    m = cv2.BFMatcher(cv2.NORM_HAMMING).knnMatch(db, da, k=2)
    good = [x[0] for x in m if len(x) == 2 and x[0].distance < 0.75 * x[1].distance]
    if len(good) < 12:
        return None, 0.0, len(good)
    src = np.float32([kb[g.queryIdx].pt for g in good])
    dst = np.float32([ka[g.trainIdx].pt for g in good])
    H, mask = cv2.findHomography(src, dst, cv2.RANSAC, 3.0)
    return H, float(mask.mean()) if mask is not None else 0.0, len(good)


def residual(a, b, H):
    h, w = a.shape[:2]
    wb = cv2.warpPerspective(b, H, (w, h))
    valid = cv2.warpPerspective(np.ones(b.shape[:2], np.uint8), H, (w, h)) > 0
    ga = cv2.GaussianBlur(cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), (5, 5), 0).astype(float)
    gb = cv2.GaussianBlur(cv2.cvtColor(wb, cv2.COLOR_BGR2GRAY), (5, 5), 0).astype(float)
    # edge-structure agreement (NCC of gradient magnitude) inside the valid area
    ea = cv2.magnitude(cv2.Sobel(ga, cv2.CV_64F, 1, 0), cv2.Sobel(ga, cv2.CV_64F, 0, 1))[valid]
    eb = cv2.magnitude(cv2.Sobel(gb, cv2.CV_64F, 1, 0), cv2.Sobel(gb, cv2.CV_64F, 0, 1))[valid]
    ncc = float(np.corrcoef(ea, eb)[0, 1])
    mad = float(np.abs(ga[valid] - gb[valid]).mean())
    return wb, valid, ncc, mad, float(valid.mean())


def decompose(H, w, h):
    c = np.float32([[w / 2, h / 2], [0, 0], [w, 0], [0, h], [w, h]]).reshape(-1, 1, 2)
    p = cv2.perspectiveTransform(c, H).reshape(-1, 2)
    scale = np.linalg.norm(p[2] - p[1]) / w
    shift = p[0] - np.float32([w / 2, h / 2])
    return {"scale": round(float(scale), 4), "shift_px": [round(float(shift[0]), 1), round(float(shift[1]), 1)]}


def texture(f):
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(g, cv2.CV_64F).var())


def main():
    clip, still = sys.argv[1], sys.argv[2]
    is_a = "--A" in sys.argv
    base = os.path.splitext(clip)[0]
    info = probe(clip)
    fr = frames(clip)
    info["decoded_frames"] = len(fr)
    info["sheet_frames"] = sheet(fr, base + "_sheet.jpg", info["fps"] or 24)
    st = cv2.imread(still)
    st = cv2.resize(st, (fr[0].shape[1], fr[0].shape[0]), interpolation=cv2.INTER_AREA)
    # first-frame fidelity: frame 0 vs the input still
    H0, inl0, _ = homog(st, fr[0])
    if H0 is not None:
        _, _, ncc0, mad0, _ = residual(st, fr[0], H0)
        info["frame0_vs_input"] = {"edge_ncc": round(ncc0, 3), "mad": round(mad0, 2), **decompose(H0, st.shape[1], st.shape[0])}
    # duplicate frames (stutter)
    d = [float(np.abs(fr[i].astype(int) - fr[i - 1].astype(int)).mean()) for i in range(1, len(fr))]
    info["dup_frames"] = int(sum(x < 0.3 for x in d))
    info["texture_laplacian_var"] = [round(texture(fr[i]), 1) for i in info["sheet_frames"]]
    # shape stability: every sheet frame aligned back onto frame 0 (rigid-scene check)
    stab = []
    for i in info["sheet_frames"][1:]:
        H, inl, n = homog(fr[0], fr[i])
        if H is None:
            stab.append({"frame": i, "matches": n, "fail": True})
            continue
        _, _, ncc, mad, cov = residual(fr[0], fr[i], H)
        stab.append({"frame": i, "inlier_ratio": round(inl, 3), "matches": n, "edge_ncc_after_align": round(ncc, 3),
                     "mad_after_align": round(mad, 2), "overlap": round(cov, 3), **decompose(H, fr[0].shape[1], fr[0].shape[0])})
    info["stability_vs_frame0"] = stab
    if is_a:
        a, b = fr[0], fr[-1]
        cv2.imwrite(base + "_overlay_raw.jpg", cv2.addWeighted(a, 0.5, b, 0.5, 0), [cv2.IMWRITE_JPEG_QUALITY, 88])
        H, _, _ = homog(a, b)
        if H is not None:
            wb, valid, _, _, _ = residual(a, b, H)
            ga, gb = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), cv2.cvtColor(wb, cv2.COLOR_BGR2GRAY)
            ana = np.dstack([gb, gb, ga])   # BGR: red = first frame, cyan = aligned last frame
            ana[~valid] = 0
            cv2.imwrite(base + "_overlay_aligned.jpg", ana, [cv2.IMWRITE_JPEG_QUALITY, 88])
    json.dump(info, open(base + "_stats.json", "w"), indent=1)
    print(json.dumps({k: v for k, v in info.items() if k != "raw"}, indent=1))
    print("\n".join(info["raw"]))


if __name__ == "__main__":
    main()
