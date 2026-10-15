"""Teacher-forced Whisper large-v3 log-likelihood of candidate transcripts for an audio window ("listening check").
usage: score_candidates.py JSON  where JSON = [[start, end, lang, [cand1, cand2, ...]], ...]"""
import json, sys, subprocess
from pathlib import Path
import numpy as np, torch, whisper, imageio_ffmpeg
ROOT = Path(__file__).resolve().parents[1]
src = sys.argv[2] if len(sys.argv) > 2 else str(ROOT/'work/demucs/htdemucs_ft/song/vocals.wav')
dec = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', src, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(dec, dtype=np.float32).copy()
model = whisper.load_model('large-v3', device='cuda')
for a, b, lang, cands in json.loads(sys.argv[1]):
    seg = whisper.pad_or_trim(torch.from_numpy(audio[int(a*16000):int(b*16000)]))
    mel = whisper.log_mel_spectrogram(seg, n_mels=128).to('cuda')
    with torch.no_grad():
        feats = model.encoder(mel[None])
    tok = whisper.tokenizer.get_tokenizer(True, language=lang, task='transcribe', num_languages=model.num_languages)
    res = []
    for c in cands:
        text = tok.encode(' ' + c.strip()) if lang == 'en' else tok.encode(c)
        seq = list(tok.sot_sequence) + [tok.no_timestamps] + text + [tok.eot]
        t = torch.tensor([seq], device='cuda')
        with torch.no_grad():
            logits = model.decoder(t[:, :-1], feats)
        lp = torch.log_softmax(logits.float(), -1)[0]
        n0 = len(tok.sot_sequence) + 1
        tgt = t[0, n0:]
        ll = lp[n0-1:, :].gather(1, tgt[:, None])[:, 0]
        res.append((ll.sum().item(), ll.mean().item(), c))
    print(f'--- {a}-{b} [{lang}]')
    for s, m, c in sorted(res, key=lambda r: -r[0]):
        print(f'   total {s:8.2f}  mean {m:6.2f}  {c}')
