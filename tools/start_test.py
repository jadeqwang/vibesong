"""For each line where aligners disagree on the start, window from the LATER candidate and test (Whisper likelihood)
whether the first word is still inside: full text vs text minus first word(s)."""
import json, re, subprocess
from pathlib import Path
import numpy as np, torch, whisper, imageio_ffmpeg
ROOT = Path(__file__).resolve().parents[1]
dec = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(ROOT/'work/demucs/htdemucs_ft/song/vocals.wav'),
                      '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
audio = np.frombuffer(dec, dtype=np.float32).copy()
model = whisper.load_model('large-v3', device='cuda')
S = {d['id']: d for d in json.load(open(ROOT/'work/aligned_raw.json'))}
SR = {d['id']: d for d in json.load(open(ROOT/'work/aligned_refined.json'))}
C = {d['id']: d for d in json.load(open(ROOT/'work/ctc_align.json'))}
def score(a, b, lang, cands):
    seg = whisper.pad_or_trim(torch.from_numpy(audio[int(a*16000):int(b*16000)]))
    mel = whisper.log_mel_spectrogram(seg, n_mels=128).to('cuda')
    with torch.no_grad(): feats = model.encoder(mel[None])
    tok = whisper.tokenizer.get_tokenizer(True, language=lang, task='transcribe', num_languages=model.num_languages)
    out = []
    for c in cands:
        text = tok.encode(' ' + c) if lang == 'en' else tok.encode(c)
        seq = list(tok.sot_sequence) + [tok.no_timestamps] + text + [tok.eot]
        t = torch.tensor([seq], device='cuda')
        with torch.no_grad(): lp = torch.log_softmax(model.decoder(t[:, :-1], feats).float(), -1)[0]
        n0 = len(tok.sot_sequence) + 1
        out.append(float(lp[n0-1:].gather(1, t[0, n0:, None])[:, 0].sum()))
    return out
def units(ln):
    txt = ln['align_text']
    return re.findall(r"[A-Za-z',!?]+", txt) if ln['lang'] == 'en' else re.findall(r"[A-Za-z]+|[一-鿿]", txt)
res = {}
for i in S:
    ln = S[i]; u = units(ln)
    starts = {'S_raw': S[i]['words'][0]['start'], 'S_ref': SR[i]['words'][0]['start'], 'CTC': C[i]['words'][0]['start']}
    end = max(S[i]['words'][-1]['end'], C[i]['words'][-1]['end']) + 0.3
    joiner = ' ' if ln['lang'] == 'en' else ''
    cands = [joiner.join(u[k:]) for k in range(0, min(3, len(u)))]
    row = {}
    for name, st in sorted(set((v, k) for k, v in starts.items())):
        pass
    for k, st in starts.items():
        sc = score(st - 0.06, end, ln['lang'], cands)
        row[k] = (st, int(np.argmax(sc)), [round(x, 1) for x in sc])
    res[i] = row
    print(f"{i:3d} {ln['text'][:28]:28s} " + ' | '.join(f"{k} {v[0]:.2f}: drop{v[1]} {v[2]}" for k, v in row.items()), flush=True)
json.dump(res, open(ROOT/'work/start_test.json', 'w'), indent=1)
