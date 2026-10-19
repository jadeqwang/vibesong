"""Install strips into assets/sprites/sprites.json (A-2/A-3). Backs up sprites.json to assets/sheets/bak/ first.
Usage (lib): install(name, file, frame_w, frame_h, frames, anchor, fps, loop, note, source)"""
import json, os, shutil, time
from PIL import Image
R = "/home/jade/Documents/vibesong"; SP = R + "/assets/sprites/"; BAK = R + "/assets/sheets/bak/"
def backup():
    os.makedirs(BAK, exist_ok=True)
    dst = BAK + "sprites.json." + time.strftime("%Y%m%d_%H%M%S")
    shutil.copy(SP + "sprites.json", dst); return dst
def install(entries):
    """entries: list of dicts with name + sprite fields; checks the png size matches."""
    b = backup()
    meta = json.load(open(SP + "sprites.json"))
    for e in entries:
        e = dict(e); name = e.pop("name")
        im = Image.open(SP + e["file"]).convert("RGBA")
        assert im.width == e["frame_w"] * e["frames"] and im.height == e["frame_h"], (name, im.size)
        cols = {p[:3] for p in im.getdata() if p[3] >= 128}
        e.setdefault("colors", len(cols))
        assert all(p[3] in (0, 255) for p in im.getdata()), name + ": non-binary alpha"
        order = ["file", "frame_w", "frame_h", "frames", "anchor", "fps", "loop", "colors", "source", "note"]
        meta["sprites"][name] = {k: e[k] for k in order if k in e} | {k: v for k, v in e.items() if k not in order}
    json.dump(meta, open(SP + "sprites.json", "w"), indent=1, ensure_ascii=False)
    return b
