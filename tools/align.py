"""Forced alignment of the canonical lyric text (as performed) to the demucs vocal stem, one line per search window.
Windows come from the independent ASR passes (work/asr.json + windowed checks). Run with moongazing venv python."""
import json, subprocess
from pathlib import Path
import numpy as np, imageio_ffmpeg, stable_whisper
ROOT = Path(__file__).resolve().parents[1]
dec = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(ROOT/'work/demucs/htdemucs_ft/song/vocals.wav'),
                      '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
audio = np.frombuffer(dec, dtype=np.float32).copy()
L = json.loads((ROOT/'tools/lines.json').read_text())
model = stable_whisper.load_model('large-v3', device='cuda')
out = []
for ln in L:
    a, b = ln['win']
    r = model.align(audio[int(a*16000):int(b*16000)], ln['align_text'], language=ln['lang'],
                    original_split=False, regroup=False, vad=False, suppress_silence=True, verbose=None)
    words = [dict(w=w.word, start=round(w.start+a, 3), end=round(w.end+a, 3), p=round(float(w.probability), 3))
             for s in r.segments for w in s.words]
    out.append(dict(ln, words=words))
    print(f"{ln['id']:>3} {words[0]['start']:7.2f}-{words[-1]['end']:7.2f} {ln['align_text']} | " +
          ' '.join(f"{w['w'].strip()}@{w['start']:.2f}-{w['end']:.2f}({w['p']:.2f})" for w in words), flush=True)
(ROOT/'work/aligned_raw.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
