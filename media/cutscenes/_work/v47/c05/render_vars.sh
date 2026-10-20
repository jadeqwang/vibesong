#!/bin/bash
# v47_trio: card 05 take/timing variants from the SHADOW tree engine_v47trio (own copy of act3/card05.js; the real file is never flipped).
# usage: render_vars.sh [VARIANT ...]   VARIANT = v46 | a1_shift+0 | ...
S=/home/jade/Documents/vibesong/engine_v47trio; O=/home/jade/Documents/vibesong/engine/out/review/v47/v47_trio
while ! grep -q DONE /home/jade/Documents/vibesong/media/cutscenes/_work/v47/js/render_vars.log 2>/dev/null; do sleep 5; done   # one render at a time
while pgrep -f "v47_trio/[c]05_147.*--audio" >/dev/null; do sleep 3; done   # an earlier render still running
cd $S && export TMPDIR=/home/jade/Documents/vibesong/engine/out/dev/tmp && mkdir -p $TMPDIR
for V in "$@"; do
  if [ "$V" = v46 ]; then Q=null; else Q="'$V'"; fi
  sed -i "s/^const CARD05_V47 = .*;   \/\/ v47_trio switch/const CARD05_V47 = $Q;   \/\/ v47_trio switch/" src/scenes/act3/card05.js
  grep -q "^const CARD05_V47 = $Q;" src/scenes/act3/card05.js || { echo "flip failed $V"; exit 1; }
  echo "== $V $(date +%T)"
  node render.js --show main --from 105.6 --to 110.8 --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b+cs \
    --mp4 $O/c05_147_${V}.mp4 --audio --workers 1 2>&1 | grep -E "card05|rror|wrote" | tail -3
done
echo DONE $(date +%T)
