import os, sys, json, time
sys.path.insert(0, "/home/jade/Documents/vibesong/tools/gen")
import cf  # noqa
from PIL import Image

W = os.path.dirname(os.path.abspath(__file__))
CONC = os.path.dirname(W)
RAW = os.path.join(W, "raw"); os.makedirs(RAW, exist_ok=True)
REF = os.path.join(W, "refs"); os.makedirs(REF, exist_ok=True)
SPEND = os.path.join(CONC, "spend.txt")
BUDGET = 12.4  # + $8 canon audit pass
IN = "/home/jade/Documents/vibesong/inputs"
PROTO = "/home/jade/Documents/vibesong/keyframes/proto"

JADE = ("JADE: young East Asian woman, long straight black hair falling past her shoulders with a small top-knot bun "
        "pierced by two pencils (one pencil has a pink-orange eraser cap, the other a blue eraser cap), orange over-ear "
        "headphones around her neck, white cropped bomber jacket with orange horizontal stripes across chest and sleeves "
        "(no patches, no lettering), black crop top, very baggy navy cargo pants with dangling orange straps, chunky white sneakers")
CHARLIE = ("CHARLIE: young man, curly dark hair under a beige newsboy flat cap, plain charcoal t-shirt, blue jeans, brown "
           "leather boots, acoustic guitar on a brown strap")
RICKY = ("RICKY: young East Asian man, short spiky black hair, blue-and-white vertical-striped button shirt with rolled "
         "sleeves, blue jeans, white sneakers, natural-wood Stratocaster electric guitar with white pickguard and navy strap")


def spent():
    if not os.path.exists(SPEND):
        return 0.0
    tot = 0.0
    for line in open(SPEND):
        parts = line.split("\t")
        if len(parts) > 3 and parts[3].startswith("$"):
            try: tot += float(parts[3][1:])
            except ValueError: pass
    return tot


def refs():
    """Build cropped reference images once."""
    out = {}
    specs = {
        "jade": (f"{IN}/jade_anime.png", (0, 0, 500, 657)),
        "charlie": (f"{IN}/charlie_anime.png", (0, 0, 500, 784)),
        "ricky": (f"{IN}/ricky-anime.png", (0, 0, 500, 784)),
        "jade_paper": (f"{IN}/rewind_thumb_C_ghost_sprint.png", (520, 0, 1280, 720)),
    }
    for k, (p, box) in specs.items():
        o = os.path.join(REF, k + ".png")
        if not os.path.exists(o):
            Image.open(p).convert("RGB").crop(box).save(o)
        out[k] = o
    # three-character lineup in one image
    o = os.path.join(REF, "trio.png")
    if not os.path.exists(o):
        ims = [Image.open(out[k]) for k in ("jade", "charlie", "ricky")]
        h = 784; ims = [im.resize((int(im.width * h / im.height), h)) for im in ims]
        tw = sum(im.width for im in ims)
        c = Image.new("RGB", (tw, h), (240, 240, 238)); x = 0
        for im in ims: c.paste(im, (x, 0)); x += im.width
        c.save(o)
    out["trio"] = o
    o = os.path.join(REF, "pixel_proto.png")
    if not os.path.exists(o):
        Image.open(f"{PROTO}/turn_000.png").convert("RGB").resize((1280, 720), Image.NEAREST).save(o)
    out["pixel"] = o
    o = os.path.join(REF, "voxel_proto.png")
    if not os.path.exists(o):
        Image.open(f"{PROTO}/turn_100.png").convert("RGB").resize((1280, 720), Image.LANCZOS).save(o)
    out["voxel"] = o
    return out


def gen(key, model, prompt, images=(), out=None, extra=None):
    """Run one generation, log spend. Returns output path."""
    if model.startswith("openai/"):
        inp = {"prompt": prompt, "size": "1536x1024", "quality": "high", "output_format": "png"}
        if images: inp["images"] = [f"file:{p}" for p in images]
    else:
        inp = {"prompt": prompt, "aspect_ratio": "16:9", "image_size": "2K", "output_format": "png"}
        if images: inp["image_input"] = [f"file:{p}" for p in images]
    if extra: inp.update(extra)
    est, _ = cf.estimate(model, inp)
    est = est or 0.2
    if spent() + est > BUDGET:
        raise SystemExit(f"budget: spent {spent():.2f} + {est} > {BUDGET}")
    n = 1
    while os.path.exists(os.path.join(RAW, f"{key}_v{n}.png")): n += 1
    out = out or os.path.join(RAW, f"{key}_v{n}.png")
    t0 = time.time()
    try:
        paths = cf.generate(model, inp, out, tag=f"concept-{key}")
        ok, res = True, paths[0]
    except Exception as e:  # noqa
        ok, res = False, str(e)[:300]
    with open(SPEND, "a") as f:
        f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')}\t{key}\t{model}\t${est if ok else 0:.4f}\t"
                f"{'ok ' + os.path.basename(res) if ok else 'FAILED (not billed) ' + res}\t{time.time()-t0:.0f}s\n")
    print(key, "OK" if ok else "FAIL", res, f"spent={spent():.2f}")
    return res if ok else None
