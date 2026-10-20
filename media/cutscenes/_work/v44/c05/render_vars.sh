#!/bin/bash
# v44_paper: card 05 section renders 105-111.5 (540p, audio). V1 = installed (t1 109.03); V2 = t1 109.62 (temporary one-line flip of main.js, restored at the end).
cd /home/jade/Documents/vibesong/engine; export TMPDIR=$PWD/out/dev/tmp
P=../media/cutscenes/paper_0147; O=out/review/v44/v44_paper
R(){ node render.js --show main --from 105 --to 111.5 --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b+cs --mp4 $O/$1.mp4 --audio --workers 1 > $O/$1.log 2>&1; echo "done $1 $(date +%T)"; }
flip(){ python3 - "$1" "$2" <<'PY'
import sys; p='src/show/main.js'; s=open(p).read(); a="{ id: 'act3.card05', t0: 107.23, t1: %s," % sys.argv[1]; b="{ id: 'act3.card05', t0: 107.23, t1: %s," % sys.argv[2]
assert s.count(a)==1, a; open(p,'w').write(s.replace(a,b))
PY
}
use(){ cp $P/paper_0147_v44_shift$1.mp4 $P/paper_0147.mp4; touch $P/paper_0147.mp4; }
use +0; R p05_V1_card107.23-109.03_shift+0
flip 109.03 109.62
trap 'flip 109.62 109.03; use +0' EXIT
for K in +0 -2 +2 +4 +6 +8; do use $K; R p05_V2_card107.23-109.62_shift$K; done
