#!/usr/bin/env python3
"""MODELS team gate helper (round 2). Two steps around tools/models_shots.js:
  models_gate.py specs  <workdir>            -> <workdir>/bench.json (portraits, actions, keyframe framings)
  models_gate.py sheets <workdir> <suffix>   -> engine/out/review/models/*<suffix>.jpg (+ portraits<suffix>/)
Bench images are written to <workdir>/; in-show stills are expected as <workdir>/{carve,native}_<t>.png.
Run with the project venv: /home/jade/Documents/vibesong/.venv/bin/python engine/tools/models_gate.py ...
"""
import json, os, sys, glob
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PROJ = os.path.dirname(ROOT)
OUT = os.path.join(ROOT, 'out', 'review', 'models')
K = 1.3                                  # native world scale (heroes.js SCALE): bench framings scale with it
CAM = dict(yaw=0, pitch=6, dist=125 * K, ty=27 * K)
VARIANTS = [('jade_up', dict(name='jade', pencil=False)), ('jade_down', dict(name='jade', pencil=True)), ('charlie_hat', dict(name='charlie')),
            ('charlie_nohat', dict(name='charlie', hat=False)), ('ricky', dict(name='ricky'))]
VIEWS = [('front', -90), ('34', -45), ('side', 0), ('back', 90)]
ACTS = [('jade_run', dict(name='jade', anim='run', t=0.12, pencil=True)), ('jade_draw_lunge', dict(name='jade', anim='draw_rainbow', t=0.1, pencil=True)),
        ('jade_sing', dict(name='jade', anim='sing', t=0.1, pencil=True)), ('jade_jump', dict(name='jade', anim='jump', t=0.05)),
        ('charlie_chord', dict(name='charlie', anim='chord', t=0.1)), ('charlie_throw', dict(name='charlie', anim='throw', t=0.35)),
        ('charlie_run', dict(name='charlie', anim='run', t=0.1)), ('charlie_shield', dict(name='charlie', anim='shield', t=0.1)),
        ('ricky_chord', dict(name='ricky', anim='chord', t=0.1)), ('ricky_sustain', dict(name='ricky', anim='sustain', t=0.1))]

def font(n=22):
    try: return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', n)
    except Exception: return ImageFont.load_default()

def specs(wd):
    S = []
    for vn, h in VARIANTS:
        for wn, r in VIEWS: S.append(dict(file=f'{wd}/{vn}_{wn}.png', heroes=[dict(h, x=0, rotY=r, anim='idle', t=0.0)], cam=CAM))
    S.append(dict(file=f'{wd}/jade_up_left.png', heroes=[dict(name='jade', x=0, rotY=180)], cam=CAM))
    for an, h in ACTS: S.append(dict(file=f'{wd}/act_{an}.png', heroes=[dict(h, x=0, rotY=-50)], cam=CAM))
    S.append(dict(file=f'{wd}/kf_k08b.png', bg='#e3b9a6', heroes=[dict(name='charlie', x=-30 * K, z=16 * K, rotY=105, anim='idle', t=0.2), dict(name='ricky', x=-4 * K, z=-16 * K, rotY=-130, anim='sustain', t=0.1),
              dict(name='jade', x=18 * K, z=-2 * K, rotY=65, anim='idle', t=0.2)], cam=dict(yaw=-24, pitch=9, dist=150 * K, ty=27 * K, tx=-6 * K)))
    S.append(dict(file=f'{wd}/kf_k09.png', bg='#eae6df', heroes=[dict(name='jade', x=-30 * K, z=10 * K, rotY=-70, anim='draw_rainbow', t=0.1, pencil=True), dict(name='charlie', x=22 * K, z=-18 * K, rotY=-80, anim='chord', t=0.2),
              dict(name='ricky', x=44 * K, z=-8 * K, rotY=-80, anim='chord', t=0.1)], cam=dict(yaw=-8, pitch=26, dist=210 * K, ty=20 * K, tx=8 * K)))
    # 3x granularity comparisons: k08b's on-screen scale (its Charlie head is ~120 px tall at 1080p -> camera 242 units away)
    S.append(dict(file=f'{wd}/close_charlie.png', bg='#e3b9a6', heroes=[dict(name='charlie', rotY=105, anim='idle', t=0.2)], cam=dict(yaw=-24, pitch=9, dist=242, ty=61)))
    S.append(dict(file=f'{wd}/close_jade_legs.png', bg='#e3b9a6', heroes=[dict(name='jade', rotY=65, anim='idle', t=0.2)], cam=dict(yaw=-24, pitch=9, dist=242, ty=19)))
    # face close-ups at the k09 / k08b reference angles (head ~60% of the frame height)
    for n, h, r in [('jade', dict(name='jade', pencil=True), -62), ('charlie', dict(name='charlie'), -100), ('ricky', dict(name='ricky'), -125)]:
        S.append(dict(file=f'{wd}/face_{n}.png', heroes=[dict(h, rotY=r, anim='idle', t=0.0)], cam=dict(yaw=0, pitch=14, dist=64, ty=61)))
    # heads-only turnaround (r4): each variant, 4 views, head filling the frame
    for vn, h in VARIANTS:
        for wn, r in VIEWS: S.append(dict(file=f'{wd}/head_{vn}_{wn}.png', heroes=[dict(h, x=0, rotY=r, anim='idle', t=0.0)], cam=dict(yaw=0, pitch=8, dist=58, ty=62)))
    json.dump(S, open(f'{wd}/bench.json', 'w')); print(len(S), 'shots')

def fit(im, w, h, bg=(18, 18, 18)):
    im = im.convert('RGB'); r = min(w / im.width, h / im.height); im = im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS)
    c = Image.new('RGB', (w, h), bg); c.paste(im, ((w - im.width) // 2, (h - im.height) // 2)); return c

def bbox_color(im, rgb, tol=40, region=None):
    """bbox of pixels near rgb (optionally inside region box) -> (x0, y0, x1, y1) or None"""
    import numpy as np
    a = np.asarray(im.convert('RGB')).astype(int); m = (np.abs(a - np.array(rgb)).sum(2) < tol)
    if region: z = np.zeros_like(m); x0, y0, x1, y1 = region; z[y0:y1, x0:x1] = m[y0:y1, x0:x1]; m = z
    ys, xs = np.where(m)
    if not len(xs): return None
    return int(np.percentile(xs, 2)), int(np.percentile(ys, 2)), int(np.percentile(xs, 98)), int(np.percentile(ys, 98))

def crop3(im, cx, cy, w, h):
    b = (int(cx - w / 2), int(cy - h / 2), int(cx + w / 2), int(cy + h / 2)); c = im.crop(b); return c.resize((c.width * 3, c.height * 3), Image.NEAREST)

def sheets(wd, sfx):
    os.makedirs(OUT, exist_ok=True); F = font(22)
    pdir = os.path.join(OUT, 'portraits' + sfx); os.makedirs(pdir, exist_ok=True)
    for f in sorted(glob.glob(wd + '/*_*.png')):
        n = os.path.basename(f)[:-4]
        if n.startswith(('kf_', 'carve_', 'native_')): continue
        Image.open(f).convert('RGB').save(f'{pdir}/{n}.jpg', quality=90)
    # turnarounds + actions
    cw, ch = 760, 1040; x0 = (1920 - cw) // 2; y0 = 20; LH = 28; tw, th = cw // 2, ch // 2
    T = Image.new('RGB', (len(VIEWS) * tw, len(VARIANTS) * (th + LH)), (25, 25, 25)); D = ImageDraw.Draw(T)
    for i, (v, _) in enumerate(VARIANTS):
        for j, (w, _) in enumerate(VIEWS):
            im = Image.open(f'{wd}/{v}_{w}.png').convert('RGB').crop((x0, y0, x0 + cw, y0 + ch)).resize((tw, th), Image.LANCZOS)
            T.paste(im, (j * tw, i * (th + LH) + LH)); D.text((j * tw + 6, i * (th + LH) + 3), f'{v} {w.replace("34", "3/4")}', fill=(255, 230, 80), font=F)
    T.save(f'{OUT}/turnarounds{sfx}.jpg', quality=88)
    A = [f'{wd}/act_{a}.png' for a, _ in ACTS]; T2 = Image.new('RGB', (5 * tw, 2 * (th + LH)), (25, 25, 25)); D = ImageDraw.Draw(T2)
    for k, f in enumerate(A):
        im = Image.open(f).convert('RGB').crop((x0 - 60, y0, x0 + cw - 60, y0 + ch)).resize((tw, th), Image.LANCZOS)
        x = (k % 5) * tw; y = (k // 5) * (th + LH); T2.paste(im, (x, y + LH)); D.text((x + 6, y + 3), os.path.basename(f)[4:-4], fill=(255, 230, 80), font=F)
    T2.save(f'{OUT}/actions{sfx}.jpg', quality=88)
    # keyframes vs native, 3x granularity crops, carve vs native in the show
    CW, CH = 960, 540
    k08b = Image.open(f'{PROJ}/keyframes/concepts/k08b_coop_crossing.png').convert('RGB'); k09 = Image.open(f'{PROJ}/keyframes/concepts/k09_bug_dance_paint_flood.png').convert('RGB')
    n08 = Image.open(f'{wd}/kf_k08b.png').convert('RGB'); n09 = Image.open(f'{wd}/kf_k09.png').convert('RGB')
    rows = [[(fit(k08b.crop((150, 250, 900, 920)), CW, CH), 'TARGET k08b (crop)'), (fit(n08.crop((160, 40, 1600, 1060)), CW, CH), f'NATIVE{sfx.replace("_", " ")} at k08b framing (bench)')],
            [(fit(k09.crop((980, 470, 1830, 800)), CW, CH), 'TARGET k09 (crop)'), (fit(n09.crop((160, 60, 1760, 960)), CW, CH), f'NATIVE{sfx.replace("_", " ")} at k09 framing (bench)')]]
    # 3x: k08b Charlie's cap + curls and Jade's cargo leg vs ours, rendered at k08b's on-screen scale (close_* shots, centred)
    cc = Image.open(f'{wd}/close_charlie.png').convert('RGB'); cl = Image.open(f'{wd}/close_jade_legs.png').convert('RGB')
    rows.append([(fit(crop3(k08b, 340, 420, 200, 200), CW, CH), 'k08b 3x: cap + curls'), (fit(crop3(cc, 960, 540, 200, 200), CW, CH), f'NATIVE{sfx.replace("_", " ")} 3x: cap + curls (k08b on-screen scale)')])
    rows.append([(fit(crop3(k08b, 710, 660, 180, 200), CW, CH), 'k08b 3x: cargo pants'), (fit(crop3(cl, 960, 540, 180, 200), CW, CH), f'NATIVE{sfx.replace("_", " ")} 3x: cargo pants (k08b on-screen scale)')])
    for t in ['084', '101.5', '104.6', '108']:
        rows.append([(fit(Image.open(f'{wd}/carve_{t}.png'), CW, CH), f'CARVE (current default)  t={t}'), (fit(Image.open(f'{wd}/native_{t}.png'), CW, CH), f'NATIVE{sfx.replace("_", " ")} (--fig native)  t={t}')])
    LH2 = 30; out = Image.new('RGB', (2 * CW, len(rows) * (CH + LH2)), (18, 18, 18)); D = ImageDraw.Draw(out)
    for i, r in enumerate(rows):
        for j, (im, l) in enumerate(r):
            x = j * CW; y = i * (CH + LH2); out.paste(im, (x, y + LH2)); D.text((x + 8, y + 4), l, fill=(255, 230, 80), font=F)
    out.save(f'{OUT}/heroes_vs_keyframes_sheet{sfx}.jpg', quality=88)
    for t in ['084', '101.5', '104.6', '108']:
        for src in ['carve', 'native']: Image.open(f'{wd}/{src}_{t}.png').convert('RGB').save(f'{OUT}/{src}_main_{t}{sfx}.jpg', quality=90)
    print('sheets ->', OUT)

def faces(wd, sfx):
    """per hero, 1920x1080: the keyframe face (left, upscaled) next to the native face at a matching angle (right)"""
    F = font(30)
    k09 = Image.open(f'{PROJ}/keyframes/concepts/k09_bug_dance_paint_flood.png').convert('RGB'); k08b = Image.open(f'{PROJ}/keyframes/concepts/k08b_coop_crossing.png').convert('RGB')
    refs = {'jade': (k09, (1100, 490, 1220, 610), 'k09'), 'charlie': (k09, (1450, 440, 1570, 560), 'k09 (his face is not visible in k08b)'), 'ricky': (k08b, (400, 380, 520, 500), 'k08b')}
    for n, (im, box, lab) in refs.items():
        out = Image.new('RGB', (1920, 1080), (18, 18, 18)); D = ImageDraw.Draw(out)
        out.paste(fit(im.crop(box), 940, 1000), (10, 60)); nat = Image.open(f'{wd}/face_{n}.png').convert('RGB')
        out.paste(fit(nat.crop((420, 0, 1500, 1080)), 940, 1000), (970, 60))
        D.text((14, 14), f'TARGET {lab}: {n}', fill=(255, 230, 80), font=F); D.text((974, 14), f'NATIVE r3: {n} (bench, 1080p)', fill=(255, 230, 80), font=F)
        out.save(f'{OUT}/face_{n}{sfx}.jpg', quality=90)
    print('faces ->', OUT)

def faces3(wd, sfx, prev='_r3'):
    """per hero, 1920x1080: keyframe | previous round | this round"""
    F = font(28)
    k09 = Image.open(f'{PROJ}/keyframes/concepts/k09_bug_dance_paint_flood.png').convert('RGB'); k08b = Image.open(f'{PROJ}/keyframes/concepts/k08b_coop_crossing.png').convert('RGB')
    refs = {'jade': (k09, (1100, 490, 1220, 610), 'k09'), 'charlie': (k09, (1450, 440, 1570, 560), 'k09'), 'ricky': (k08b, (400, 380, 520, 500), 'k08b')}
    for n, (im, box, lab) in refs.items():
        out = Image.new('RGB', (1920, 1080), (18, 18, 18)); D = ImageDraw.Draw(out); W = 630
        out.paste(fit(im.crop(box), W, 1000), (5, 60))
        pv = os.path.join(OUT, f'face_{n}{prev}.jpg')
        if os.path.exists(pv): out.paste(fit(Image.open(pv).convert('RGB').crop((1150, 200, 1750, 800)), W, 1000), (645, 60))
        out.paste(fit(Image.open(f'{wd}/face_{n}.png').convert('RGB').crop((660, 240, 1260, 840)), W, 1000), (1285, 60))
        D.text((10, 14), f'TARGET {lab}', fill=(255, 230, 80), font=F); D.text((650, 14), f'NATIVE{prev.replace("_", " ")}', fill=(255, 230, 80), font=F); D.text((1290, 14), f'NATIVE{sfx.replace("_", " ")}', fill=(255, 230, 80), font=F)
        out.save(f'{OUT}/face_{n}{sfx}.jpg', quality=90)
    # heads-only turnaround
    V = [v for v, _ in VARIANTS]; Wv = ['front', '34', 'side', 'back']; tw, th = 400, 400; LH = 28
    T = Image.new('RGB', (4 * tw, len(V) * (th + LH)), (25, 25, 25)); D = ImageDraw.Draw(T)
    for i, v in enumerate(V):
        for j, w in enumerate(Wv):
            im = Image.open(f'{wd}/head_{v}_{w}.png').convert('RGB').crop((560, 140, 1360, 940)).resize((tw, th), Image.LANCZOS)
            T.paste(im, (j * tw, i * (th + LH) + LH)); D.text((j * tw + 6, i * (th + LH) + 3), f'{v} {w.replace("34", "3/4")}', fill=(255, 230, 80), font=font(20))
    T.save(f'{OUT}/heads_turnaround{sfx}.jpg', quality=88); print('faces3 + heads ->', OUT)

def audit(wd, sfx):
    """3x canon crops of Jade from the 1080p portraits (crop boxes follow the figure bbox)"""
    import numpy as np
    F = font(24)
    def fig_bbox(f):
        a = np.asarray(Image.open(f).convert('RGB')).astype(int); bg = a[5, 5]; m = np.abs(a - bg).sum(2) > 40; m[int(a.shape[0] * 0.93):] = False
        m[:, :700] = False; m[:, 1220:] = False                                  # the figure stands at the centre; skip its ground shadow
        ys, xs = np.where(m); return xs.min(), ys.min(), xs.max(), ys.max()
    def rel(f, fx0, fy0, fx1, fy1):    # crop box as fractions of the figure bbox (x across, y down from the top of the figure)
        x0, y0, x1, y1 = fig_bbox(f); W, H = x1 - x0, y1 - y0; return (int(x0 + fx0 * W), int(y0 + fy0 * H), int(x0 + fx1 * W), int(y0 + fy1 * H))
    C = [('jade_up_front', (0.18, 0.0, 0.82, 0.26), 'hair up: face, high centre part, brows'), ('jade_up_back', (0.1, 0.0, 0.9, 0.26), 'hair up back: pencils THROUGH the bun'),
         ('jade_down_front', (0.15, 0.03, 0.85, 0.27), 'hair down: no bun, no hair pencils'), ('jade_up_front', (0.0, 0.2, 1.0, 0.47), 'jacket: collar tab, chest band + dot, epaulets'),
         ('jade_up_back', (0.0, 0.2, 1.0, 0.5), 'back: big dot + RARE EARTH'), ('jade_up_left', (0.1, 0.22, 0.9, 0.5), '1420 MHz patch: her LEFT upper arm'),
         ('jade_down_front', (0.0, 0.4, 1.0, 0.68), 'pencils: blue R (rainbow), pink L (graphite)'), ('jade_up_34', (0.0, 0.42, 1.0, 0.75), 'cargo: pockets+flaps, free straps'),
         ('jade_up_34', (0.0, 0.78, 1.0, 1.0), 'pooled hem over chunky white sneakers')]
    tiles = []
    for f, fr, l in C:
        p = f'{wd}/{f}.png'; im = Image.open(p).convert('RGB').crop(rel(p, *fr)); im = im.resize((im.width * 3, im.height * 3), Image.NEAREST); tiles.append((fit(im, 640, 660, (25, 25, 25)), l))
    W, H = 640, 660; out = Image.new('RGB', (3 * W, 3 * (H + 34)), (25, 25, 25)); D = ImageDraw.Draw(out)
    for i, (t, l) in enumerate(tiles):
        x = (i % 3) * W; y = (i // 3) * (H + 34); out.paste(t, (x, y + 34)); D.text((x + 6, y + 4), l, fill=(255, 230, 80), font=F)
    out.save(f'{OUT}/canon_audit_3x{sfx}.jpg', quality=90); print('audit ->', OUT)

if __name__ == '__main__':
    cmd, wd = sys.argv[1], sys.argv[2]
    if cmd == 'specs': specs(wd)
    elif cmd == 'sheets': sheets(wd, sys.argv[3] if len(sys.argv) > 3 else '_r2')
    elif cmd == 'audit': audit(wd, sys.argv[3] if len(sys.argv) > 3 else '_r2')
    elif cmd == 'faces': faces(wd, sys.argv[3] if len(sys.argv) > 3 else '_r3')
    elif cmd == 'faces3': faces3(wd, sys.argv[3] if len(sys.argv) > 3 else '_r4')
