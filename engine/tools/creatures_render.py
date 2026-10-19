#!/usr/bin/env python3
"""Render dev.creatures shots by NAME (globs ok) as stills.  CREATURES team tool.
usage: python3 tools/creatures_render.py OUTDIR WxH 'k09_*' 'morph_ladybug_*' ...
The shot list (name -> index, t = 1000 + index + 0.5) is logged by src/scenes/dev/creatures_test.js at setup and cached
in out/dev/creatures/shots.json; if the scene's list changed, the cache is refreshed and you are told to re-run."""
import sys, json, subprocess, os, re, fnmatch
ENGINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ENGINE, 'out/dev/creatures/shots.json')
os.chdir(ENGINE)
out, res, names = os.path.abspath(sys.argv[1]), sys.argv[2], sys.argv[3:]
shots = json.load(open(CACHE)) if os.path.exists(CACHE) else [[0, 'k09_ladybug']]
idx = {n: i for i, n in shots}; sel = []
for n in names:
    for i, s in shots:
        if fnmatch.fnmatch(s, n) and s not in sel: sel.append(s)
if not sel: sel = [shots[0][1]]
os.makedirs(out, exist_ok=True)
jobs = ','.join(f'{1000 + idx[s] + 0.5}:{out}/{s}.png' for s in sel)
p = subprocess.run(['node', 'render.js', '--show', 'dev', '--res', res, '--stills', jobs], capture_output=True, text=True)
log = p.stdout + p.stderr
m = re.search(r'\[creatures\] shots (\[.*\])', log)
if m:
    new = json.loads(m.group(1))
    if new != shots:
        os.makedirs(os.path.dirname(CACHE), exist_ok=True); json.dump(new, open(CACHE, 'w')); print('shot list updated (re-run if names moved)')
for l in log.splitlines():
    if '[creatures] build' in l or '[creatures] cpu' in l or ('rror' in l and 'GL Driver' not in l): print(l[:4000])
print('\n'.join(f'{out}/{s}.png' for s in sel))
