#!/bin/bash
# usage (from repo root): render_vars.sh CARDDIR INSTALLED_SRC A B NAME:VARIANTFILE ...
# Swaps media/cutscenes/CARDDIR/CARDDIR_v47.mp4 to each variant, renders 540p A..B with audio to engine/out/review/v47/v47_cards/NAME.mp4,
# then RESTORES CARDDIR_v47.mp4 = INSTALLED_SRC (trap on exit).
set -u; D=$1; INST=$2; A=$3; B=$4; shift 4; M=/home/jade/Documents/vibesong/media/cutscenes/$D
trap "cp $M/$INST $M/${D}_v47.mp4; echo restored $INST" EXIT
cd /home/jade/Documents/vibesong/engine; export TMPDIR=$PWD/out/dev/tmp; O=out/review/v47/v47_cards
for nv in "$@"; do n=${nv%%:*}; v=${nv#*:}; cp $M/$v $M/${D}_v47.mp4
  node render.js --show main --from $A --to $B --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b+cs --mp4 $O/$n.mp4 --audio --workers 1 > $O/$n.log 2>&1
  echo "$n exit $? pageerr $(grep -ci 'pageerror' $O/$n.log) clip $(grep -o '\[paper\] paper.p0. [^ ]*' $O/$n.log | head -1)"; done
