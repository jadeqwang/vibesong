#!/bin/bash
# pre-battle: stills with the native figures. usage: tools/pbstills.sh <outdir> <res> t1 t2 ...
OUT=$1; RES=$2; shift 2; mkdir -p $OUT; rm -f $OUT/s_*.png
L=""; for t in "$@"; do L="$L,$t:$OUT/s_$(printf '%07.3f' $t).png"; done
node "$(dirname $0)/../render.js" --show main --fig native --figscale 1.3 --res $RES --stills ${L:1} 2>&1 | grep -iv "GPU stall\|GL Driver\|CONTEXT_LOST\|404\|plaster' is not" | tail -${TAILN:-6}
/home/jade/Documents/vibesong/.venv/bin/python $(dirname $0)/pb_strip.py $OUT/sheet.png $OUT/s_*.png
