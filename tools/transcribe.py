"""Independent ASR of the demucs vocal stem with faster-whisper large-v3 (en + zh passes), word timestamps."""
import json, subprocess
from pathlib import Path
import numpy as np, imageio_ffmpeg
from faster_whisper import WhisperModel
ROOT = Path(__file__).resolve().parents[1]
model_path = next(Path('/home/jade/.cache/huggingface/hub/models--Systran--faster-whisper-large-v3/snapshots').iterdir())
model = WhisperModel(str(model_path), device='cuda', compute_type='float16')
dec = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(ROOT/'work/demucs/htdemucs_ft/song/vocals.wav'),
                      '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
audio = np.frombuffer(dec, dtype=np.float32).copy()
prompt = "Paint it, run it, ship it! 一笔一画。Everything I love about life just blossoms. 每一天都是色彩。说出来它就存在。fixtures and the functions."
out = {}
for lang in ('en', 'zh', None):
    segs, info = model.transcribe(audio, language=lang, beam_size=5, word_timestamps=True, vad_filter=False,
                                  condition_on_previous_text=False, initial_prompt=prompt)
    res = []
    for s in segs:
        print(f'[{lang}] {s.start:7.2f}-{s.end:7.2f} {s.text}', flush=True)
        res.append(dict(start=s.start, end=s.end, text=s.text,
                        words=[dict(w=w.word, start=w.start, end=w.end, p=w.probability) for w in s.words]))
    out[str(lang)] = res
(ROOT/'work/asr.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
