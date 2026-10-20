#!/bin/bash
# v47_trio: 2:07 jade_sing timing variants, rendered from the SHADOW tree engine_v47trio (its own copy of act4/paper.js; the real file is never flipped).
S=/home/jade/Documents/vibesong/engine_v47trio; O=/home/jade/Documents/vibesong/engine/out/review/v47/v47_trio
cd $S && export TMPDIR=/home/jade/Documents/vibesong/engine/out/dev/tmp && mkdir -p $TMPDIR
for K in ${@:-v46 -4 -2 +0 +2 +3 +4 +6}; do
  if [ "$K" = v46 ]; then V=null; else V="'$K'"; fi
  sed -i "s/^const JADE_SING_V47 = .*;   \/\/ v47_trio/const JADE_SING_V47 = $V;   \/\/ v47_trio/" src/scenes/act4/paper.js
  grep -q "^const JADE_SING_V47 = $V;" src/scenes/act4/paper.js || { echo "flip failed $K"; exit 1; }
  echo "== $K $(date +%T)"
  node render.js --show main --from 124.0 --to 129.4 --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b+cs \
    --mp4 $O/js207_shift${K}.mp4 --audio --workers 1 2>&1 | grep -E "jade_sing|error|Error|wrote|frames" | tail -4
done
echo DONE $(date +%T)
