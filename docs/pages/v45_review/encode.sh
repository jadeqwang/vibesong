#!/bin/bash
# usage: encode.sh <src.mp4> <name>  -> v/<name>.mp4 (540p crf 25, aac 128k, faststart) for the v4.5 review page
FF=/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2
cd /home/jade/Documents/vibesong/docs/pages/v45_review
$FF -nostdin -v error -y -i "$1" -c:v libx264 -crf 25 -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "v/$2.mp4" && echo "$2 $(du -h v/$2.mp4 | cut -f1)"
