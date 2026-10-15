import numpy as np, librosa, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
g = np.load('work/grid_beats.npy'); sr = 22050
fig, axs = plt.subplots(4, 1, figsize=(20, 11))
for ax, (stem, a, b) in zip(axs, [('drums', 64, 82), ('other', 64, 82), ('drums', 158, 175.5), ('other', 158, 175.5)]):
    y = librosa.load(f'work/demucs/htdemucs_ft/song/{stem}.wav', sr=sr, mono=True, offset=a, duration=b-a)[0]
    S = librosa.amplitude_to_db(np.abs(librosa.stft(y, n_fft=1024, hop_length=128)), ref=np.max)
    ax.imshow(S[:300], origin='lower', aspect='auto', extent=[a, b, 0, 300*sr/1024], cmap='magma', vmin=-70, vmax=0)
    for x in g:
        if a <= x <= b: ax.axvline(x, color='cyan', lw=0.5, alpha=0.5)
    ax.set_xticks(np.arange(a, b, 0.5)); ax.tick_params(labelsize=7, rotation=90); ax.set_title(f'{stem} {a}-{b}s (cyan = beats)')
plt.tight_layout(); plt.savefig('work/viz/builds.png', dpi=65)
