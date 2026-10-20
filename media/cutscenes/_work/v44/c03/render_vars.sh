#!/bin/bash
# v44_paper: render card 03 warp variants 17-26 s (540p, audio), swapping paper_0020.mp4; installs R18 at the end.
set -e
cd /home/jade/Documents/vibesong/engine; export TMPDIR=$PWD/out/dev/tmp
P=../media/cutscenes/paper_0020; O=out/review/v44/v44_paper
for r in R18 R15 R24; do
  cp $P/paper_0020_v44_warp0to6_$r.mp4 $P/paper_0020.mp4; touch $P/paper_0020.mp4
  node render.js --show main --from 17 --to 26 --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b+cs --mp4 $O/p03_warp_$r.mp4 --audio --workers 1 > $O/p03_warp_$r.log 2>&1
  echo "done $r $(date +%T)"
done
cp $P/paper_0020_v44_warp0to6_R18.mp4 $P/paper_0020.mp4; touch $P/paper_0020.mp4; echo "installed R18 $(date +%T)"
