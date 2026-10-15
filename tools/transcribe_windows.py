"""Windowed re-transcription (no prompt) to resolve ambiguous passages."""
import json, subprocess, sys
from pathlib import Path
import numpy as np, imageio_ffmpeg
from faster_whisper import WhisperModel
ROOT = Path(__file__).resolve().parents[1]
model_path = next(Path('/home/jade/.cache/huggingface/hub/models--Systran--faster-whisper-large-v3/snapshots').iterdir())
model = WhisperModel(str(model_path), device='cuda', compute_type='float16')
dec = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(ROOT/'work/demucs/htdemucs_ft/song/vocals.wav'),
                      '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
audio = np.frombuffer(dec, dtype=np.float32).copy()
wins = json.loads(sys.argv[1])
for a, b in wins:
    for lang in ('en', 'zh'):
        segs, _ = model.transcribe(audio[int(a*16000):int(b*16000)], language=lang, beam_size=5, word_timestamps=True,
                                   vad_filter=False, condition_on_previous_text=False, initial_prompt=(sys.argv[2] if len(sys.argv)>2 else None))
        for s in segs:
            ws = ' '.join(f"{w.word.strip()}@{w.start+a:.2f}" for w in s.words)
            print(f'[{a}-{b} {lang}] {s.start+a:7.2f}-{s.end+a:7.2f} {s.text} || {ws}', flush=True)
