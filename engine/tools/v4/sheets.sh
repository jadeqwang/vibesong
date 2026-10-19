#!/bin/bash
# sheets.sh VIDEO OUTDIR PREFIX : 1 fps contact sheets (16 s each, 4x4, labelled with song time) via grid.py; frames deleted after
V=$1; O=$2; P=$3; FF=$(dirname $0)/../../../.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2
T=$(mktemp -d -p ${TMPDIR:-/tmp}); mkdir -p $O
$FF -v error -i $V -vf "select='not(mod(n\,30))',scale=480:-2" -fps_mode passthrough $T/f%04d.png
n=$(ls $T | wc -l); i=0
for f in $(ls $T | sort); do s=$(printf "%06.1f" $i); mv $T/$f $T/t$s.png; i=$((i+1)); done
k=1; for start in $(seq 0 16 $((n-1))); do fs=$(ls $T/t*.png | sort | sed -n "$((start+1)),$((start+16))p"); $(dirname $0)/../../../.venv/bin/python $(dirname $0)/grid.py $O/${P}_$(printf %02d $k).jpg 4 480 $fs >/dev/null; k=$((k+1)); done
rm -rf $T; ls $O | grep $P | wc -l
