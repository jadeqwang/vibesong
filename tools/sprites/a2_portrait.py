"""A-2 P1: portrait_jade_hairdown = portrait_jade (v2, coordinator hand-fixed) with the bun + pencils removed
and long loose hair framing the face and falling over both shoulders. Pure code edit, palette = portrait_jade's.
Usage: python a2_portrait.py [out.png]"""
import sys
from PIL import Image
SP = "/home/jade/Documents/vibesong/assets/sprites/"
src = Image.open(SP + "portrait_jade.png").convert("RGBA")
W = H = 32
OUT = (0x11, 0x0f, 0x12, 255); HAIR = (0x24, 0x20, 0x28, 255); HI = (0x34, 0x2f, 0x37, 255); DK = (0x1a, 0x17, 0x1d, 255)
HAIRSET = {OUT[:3], HAIR[:3], HI[:3], DK[:3]}
# hand-drawn crown (no bun), per frame; '.' = transparent, c/f/g/i = OUT/HAIR/HI/DK; rows 0..7 replaced
CROWN = {
 0: ["................................",
     "................................",
     "................................",
     "............ccccccc.............",
     "..........ccffgggfffcc..........",
     "........cfffgggffffffffc........",
     ".......cffggfffcfffffgffc.......",
     ".......cffgffccfcccfffffc......."],
 1: ["................................",
     "................................",
     "................................",
     "...........ccccccc..............",
     ".........ccffgggfffcc...........",
     ".......cfffgggfffffffffc........",
     "......cffggfffcffffffgffc.......",
     "......ccffgfccfccccffffffc......"],
}
CM = {".": None, "c": OUT, "f": HAIR, "g": HI, "i": DK}
# outer hair edge per row (relative to frame-0 head; frame 1 is shifted 1 px left)
def edges(y):
    if y < 8: return None
    L = {8: 6, 9: 5, 10: 5, 11: 4, 12: 4}.get(y, 4 if y < 26 else 3)
    R = {8: 25, 9: 26, 10: 26, 11: 27, 12: 27}.get(y, 27 if y < 24 else 28)
    return L, R
def FRONT_L(y, x):
    """one loose lock falls IN FRONT of her right shoulder (image-left); everything else hangs behind the jacket"""
    return x <= 4 + (y - 26) // 2 if y >= 26 else False
def is_hair(c): return c[3] >= 128 and c[:3] in HAIRSET
def build(f):
    px = src.crop((f * W, 0, f * W + W, H)); P = px.load()
    sh = -1 if f == 1 else 0
    for y, row in enumerate(CROWN[f]):
        for x, ch in enumerate(row):
            if ch == "." and y < 7: P[x, y] = (0, 0, 0, 0)
            elif ch != ".": P[x, y] = CM[ch]
    # drop stray bun/pencil pixels left on rows 0..8 outside the crown silhouette
    for y in range(0, 9):
        for x in range(W):
            c = P[x, y]
            if c[3] >= 128 and c[:3] not in HAIRSET and c[:3] not in {(0xfd, 0xc6, 0x92), (0xee, 0x8f, 0x66)}:
                P[x, y] = HAIR
    hair = [[False] * W for _ in range(H)]
    for y in range(8, H):
        L, R = edges(y); L += sh; R += sh
        # left curtain: from L to the first non-hair (face/neck) pixel
        x = L
        while x < W // 2:
            c = P[x, y]
            if c[3] >= 128 and not is_hair(c) and (y < 23 or not FRONT_L(y, x - sh)): break
            if y >= 23 and x > L + 6: break
            hair[y][x] = True; x += 1
        x = R
        while x > W // 2:
            c = P[x, y]
            if c[3] >= 128 and not is_hair(c): break
            if y >= 22 and x < R - 4: break
            hair[y][x] = True; x -= 1
    for y in range(H):
        for x in range(W):
            if hair[y][x]:
                # strand texture: highlight streaks every few columns, darker inner strands
                s = (x * 3 + (y // 3)) % 7
                P[x, y] = HI if s == 0 and 10 < y < 30 else (DK if s == 4 else HAIR)
    # outline: any hair pixel touching transparency becomes OUT
    Q = px.copy().load()
    for y in range(H):
        for x in range(W):
            if Q[x, y][3] >= 128 and Q[x, y][:3] in HAIRSET:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < W and 0 <= yy < H and Q[xx, yy][3] < 128: P[x, y] = OUT; break
    # strand separation lines in the shoulder spill (dark 1-px gaps between locks)
    # the front lock gets an outline on its inner (jacket) side
    for y in range(24, H):
        for x in range(W - 1):
            if hair[y][x] and not hair[y][x + 1] and x < W // 2 and P[x + 1, y][3] >= 128 and P[x + 1, y][:3] not in HAIRSET: P[x, y] = OUT
    return px
out = Image.new("RGBA", (W * 2, H), (0, 0, 0, 0))
for f in (0, 1): out.paste(build(f), (f * W, 0))
out.save(sys.argv[1] if len(sys.argv) > 1 else SP + "portrait_jade_hairdown.png")
