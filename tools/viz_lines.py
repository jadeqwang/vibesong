import json, sys, numpy as np, librosa, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib import font_manager
for f in ['/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJKsc-Regular.otf']:
    try: font_manager.fontManager.addfont(f); plt.rcParams['font.family'] = font_manager.FontProperties(fname=f).get_name(); break
    except Exception: pass
sr = 22050
v = librosa.load('work/demucs/htdemucs_ft/song/vocals.wav', sr=sr, mono=True)[0]
SR = {d['id']: d for d in json.load(open('work/aligned_refined.json'))}; C = {d['id']: d for d in json.load(open('work/ctc_align.json'))}
ids = list(map(int, sys.argv[1].split(','))); out = sys.argv[2]
fig, axs = plt.subplots(len(ids), 1, figsize=(18, 2.6*len(ids)))
for ax, i in zip(np.atleast_1d(axs), ids):
    a = min(SR[i]['words'][0]['start'], C[i]['words'][0]['start']) - (3.0 if i in (12,32) else 1.0); b = max(SR[i]['words'][-1]['end'], C[i]['words'][-1]['end']) + 0.4
    seg = v[int(a*sr):int(b*sr)]
    S = librosa.amplitude_to_db(np.abs(librosa.stft(seg, n_fft=2048, hop_length=128)), ref=np.max)
    ax.imshow(S[:280], origin='lower', aspect='auto', extent=[a, b, 0, 280*sr/2048], cmap='magma', vmin=-70, vmax=0)
    for w in SR[i]['words']:
        ax.axvline(w['start'], color='cyan', lw=1.2); ax.text(w['start'], 2700, w['w'].strip(), color='cyan', fontsize=9)
    for w in C[i]['words']:
        ax.axvline(w['start'], color='lime', lw=1.0, ls='--'); ax.text(w['start'], 300, w['w'].strip(), color='lime', fontsize=9)
    ax.set_xticks(np.arange(np.ceil(a*10)/10, b, 0.2)); ax.tick_params(axis='x', labelsize=7, rotation=90)
    ax.set_title(f"line {i}: {SR[i]['text']}   (cyan=stable-ts, green dashed=CTC)", fontsize=10); ax.set_ylabel('Hz')
plt.tight_layout(); plt.savefig(out, dpi=72)
