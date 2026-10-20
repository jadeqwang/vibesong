#!/bin/bash
# usage: run.sh TAKE CARD FRAMING NAME   (eval + mouth plot; from repo root)
OSPY=~/Documents/1-music-shipped/orbital-sunrise-video/video/out/.venv/bin/python; E=media/cutscenes/_work/v47/eval
declare -A S0=([03]=19.60 [04]=48.00 [06]=142.90)
declare -A CR=([03cur]=0.05,0.0,0.55,0.65 [03med]=0.25,0.0,0.75,0.6 [04cur]=0.25,0.0,0.75,0.6 [04med]=0.25,0.0,0.75,0.55 [06cur]=0.05,0.0,0.55,0.65 [06med]=0.1,0.0,0.55,0.6)
j=$($OSPY tools/cutscenes/pb_cards47_eval.py $1 $2 $3 $E/$4 2>/dev/null | tail -1)
c=$($OSPY tools/cutscenes/pb_mouthplot47.py $1 ${S0[$2]} $2 ${CR[$2$3]} $E/$4_mouth.png -0.4,-0.2,0,0.2 2>/dev/null | tail -1)
echo "$4 $j | $c"
