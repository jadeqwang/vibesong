#!/usr/bin/env python3
"""Build the check-in review page: review/page/index.html (+ img/ files)."""
import glob, html, json, os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'review', 'page')
IMG = os.path.join(OUT, 'img')

# concept keyframes -> jpg
concepts = []
for p in sorted(glob.glob(os.path.join(ROOT, 'keyframes/concepts/k[0-9][0-9]*.png'))):
    name = os.path.splitext(os.path.basename(p))[0]
    im = Image.open(p).convert('RGB')
    if im.width > 1280:
        im = im.resize((1280, round(im.height * 1280 / im.width)), Image.LANCZOS)
    im.save(os.path.join(IMG, name + '.jpg'), quality=84)
    concepts.append(name)

KF_TIMES = {
 'k01': ('0:02', 'Cold open: the title draws itself under her feet'),
 'k02': ('0:05', 'Paint it / run it / ship it'),
 'k03': ('0:09', 'Character select'),
 'k04': ('0:22', 'Verse 1: The Eraser chases; the "linked" chain'),
 'k05': ('0:36', 'The void: sung words become platforms'),
 'k06': ('0:56', 'Fixtures (graphite) and functions (color)'),
 'k07': ('1:22', 'Just after the turn: the plaster world'),
 'k08': ('1:48', '世界是我的舞台: three spotlights'),
 'k08b': ('1:43', 'NEW · Co-op crossing: plate, tripod, sound beam, hat holds the plate'),
 'k09': ('1:57', 'Bug dance battle + the paint flood'),
 'k10': ('2:05', 'UPDATED · Bridge: paper cutscene, painting / code (v1 face, canon pencils)'),
 'k11': ('2:19', 'The perspective lock: 画'),
 'k12': ('2:55', 'Drop 2: the world spells 一笔一画'),
 'k13': ('2:56', 'NEW · Drop 2 goes photoreal: the strokes are terraced fields'),
 'k13c': ('2:55.6', 'NEW · The second turn, mid-wave: voxels subdivide into the real world'),
 'k13b': ('3:00', 'NEW · "Fixtures!": the real world as a pencil drawing of itself'),
}

def esc(s): return html.escape(s, quote=True)

kf_html = []
for n in concepts:
    k = n.split('_')[0]
    t, cap = KF_TIMES.get(k, ('', n))
    kf_html.append(f'<figure class="kf"><img src="img/{n}.jpg" alt="{esc(cap)}" loading="lazy"><figcaption><span class="tc">{t}</span>{esc(cap)}</figcaption></figure>')

TEMPLATE = open(os.path.join(ROOT, 'review', 'page_template.html'), encoding='utf-8').read()
page = TEMPLATE.replace('<!--KEYFRAMES-->', '\n'.join(kf_html) or '<p class="muted">Concept frames still rendering.</p>')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(page)
files = {f'img/{f}': f'review/page/img/{f}' for f in sorted(os.listdir(IMG))}
files['turn_demo.mp4'] = 'review/page/turn_demo.mp4'
json.dump(files, open(os.path.join(OUT, 'files.json'), 'w'), indent=1)
print(len(concepts), 'concepts;', len(files), 'files')
