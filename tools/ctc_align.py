"""Independent CTC forced alignment (torchaudio MMS_FA, uroman-style romanization; Mandarin via pypinyin) of each lyric
line inside its search window on the demucs vocal stem. Output: work/ctc_align.json."""
import json, re, subprocess
from pathlib import Path
import numpy as np, torch, torchaudio, imageio_ffmpeg
from pypinyin import lazy_pinyin
ROOT = Path(__file__).resolve().parents[1]
dec = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(ROOT/'work/demucs/htdemucs_ft/song/vocals.wav'),
                      '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
audio = torch.from_numpy(np.frombuffer(dec, dtype=np.float32).copy())
bundle = torchaudio.pipelines.MMS_FA
model = bundle.get_model(with_star=True).to('cuda').eval()
D = bundle.get_dict(star='*')
def words_of(text):
    out = []
    for tok in re.findall(r"[A-Za-z']+|[一-鿿]", text):
        if re.match(r'[一-鿿]', tok): out.append((tok, lazy_pinyin(tok)[0]))
        else: out.append((tok, tok.lower().replace("'", "")))
    return out
L = json.loads((ROOT/'tools/lines.json').read_text())
res = []
for ln in L:
    a, b = ln['win']
    wav = audio[int(a*16000):int(b*16000)][None].to('cuda')
    with torch.inference_mode():
        em, _ = model(wav)
    em = torch.log_softmax(em, -1)
    ws = words_of(ln['align_text'])
    toks = [D['*']]
    spans_idx = []
    for _, rom in ws:
        ids = [D[c] for c in rom if c in D]
        spans_idx.append((len(toks), len(toks)+len(ids))); toks += ids
    toks.append(D['*'])
    ali, sc = torchaudio.functional.forced_align(em, torch.tensor([toks], device='cuda'), blank=0)
    ali = ali[0].cpu().numpy(); sc = sc[0].exp().cpu().numpy()
    ratio = wav.shape[1] / em.shape[1] / 16000  # seconds per frame
    # token index per frame (merge repeats) -> token occurrence spans
    tspans = []; prev = None; ti = -1
    for f, t in enumerate(ali):
        if t == 0: prev = None; continue
        if t != prev: ti += 1; tspans.append([f, f+1, [sc[f]]])
        else: tspans[-1][1] = f+1; tspans[-1][2].append(sc[f])
        prev = t
    words = []
    for (w, rom), (i0, i1) in zip(ws, spans_idx):
        seg = tspans[i0:i1]
        if not seg: continue
        s, e = seg[0][0]*ratio + a, seg[-1][1]*ratio + a
        words.append(dict(w=w, start=round(s, 3), end=round(e, 3), score=round(float(np.mean([np.mean(x[2]) for x in seg])), 3)))
    res.append(dict(id=ln['id'], text=ln['text'], words=words))
    print(f"{ln['id']:3d} {words[0]['start']:7.2f}-{words[-1]['end']:7.2f} " + ' '.join(f"{w['w']}@{w['start']:.2f}({w['score']:.2f})" for w in words), flush=True)
(ROOT/'work/ctc_align.json').write_text(json.dumps(res, ensure_ascii=False, indent=1))
