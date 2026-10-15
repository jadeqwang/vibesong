import json, numpy as np, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
TJ = json.load(open('analysis/timing.json')); E = np.load('work/env5ms.npz')
step = 0.1; k = int(step/0.005)
def ds(x): n = len(x)//k; return 10*np.log10(np.mean(10**(x[:n*k].reshape(n, k)/10), 1))
mix, voc = ds(E['mix']), ds(E['vocals']); t = np.arange(len(mix))*step + step/2
sm = lambda x, w=5: np.convolve(x, np.ones(w)/w, 'same')
BLUE, INK, INK2, GRID, SURF = '#2a78d6', '#0b0b0b', '#52514e', '#e4e3df', '#fcfcfb'
plt.rcParams.update({'font.size': 9, 'axes.edgecolor': INK2, 'axes.labelcolor': INK2, 'xtick.color': INK2, 'ytick.color': INK2})
fig, (a1, a2) = plt.subplots(2, 1, figsize=(20, 7.2), sharex=True, gridspec_kw=dict(height_ratios=[3, 1.3]), facecolor=SURF)
short = {'Intro A': 'Intro A', 'Intro B': 'Intro B', 'Verse 1': 'Verse 1', 'Pre-Chorus': 'Pre-Ch', 'Chorus 1': 'Chorus 1',
         'Chorus 1 tag / build (snare roll -> silence)': 'Build 1', 'Post-Chorus Drop 1': 'DROP 1', 'Verse 2': 'Verse 2', 'Rap Verse': 'Rap',
         'Bridge (stripped, half-time)': 'Bridge', 'Final Chorus': 'Final Chorus', 'Final Chorus tag / build (roll -> silence)': 'Build 2',
         'Post-Chorus Drop 2': 'DROP 2', 'Outro': 'Outro'}
for ax in (a1, a2):
    ax.set_facecolor(SURF)
    for i, s in enumerate(TJ['sections']):
        if i % 2 == 0: ax.axvspan(s['start'], s['end'], color='#efeeea', zorder=0, lw=0)
        ax.axvline(s['start'], color='#c9c8c2', lw=0.8, zorder=1)
    for g in TJ['silences']['key_gaps']:
        ax.axvspan(g['start'], g['end'], color='#3a3a38', alpha=0.85, zorder=3, lw=0)
    for side in ('top', 'right'): ax.spines[side].set_visible(False)
    ax.grid(axis='y', color=GRID, lw=0.6); ax.set_axisbelow(True)
a1.fill_between(t, -60, sm(mix), color=BLUE, alpha=0.18, lw=0, zorder=2)
a1.plot(t, sm(mix), color=BLUE, lw=2, zorder=4)
a1.set_ylim(-48, -8); a1.set_ylabel('Mix loudness (dBFS, 0.1 s RMS, smoothed)')
for s in TJ['sections']:
    a1.text((s['start'] + s['end'])/2, -9.5, f"{short[s['name']]}\nE{s['energy_1_10']}", ha='center', va='top', fontsize=8.5, color=INK, fontweight='bold' if 'DROP' in short[s['name']] else 'normal')
marks = [(80.81, 'Drop 1\n80.81'), (139.70, 'Slam\n139.70'), (174.395, 'Drop 2\n174.40'), (198.035, 'Tag\n198.04'), (14.012, 'Beat in\n14.01'), (7.01, '808 in\n7.01')]
for x, lab in marks:
    a1.axvline(x, color=INK, lw=1, ls=(0, (3, 2)), zorder=5); a1.text(x + 0.6, -44.5, lab, fontsize=8, color=INK, va='bottom')
a1.text(79.87, -40, 'silence', rotation=90, fontsize=7.5, color=INK2, ha='right', va='bottom')
a1.set_title('The Vibe Coding Song (一笔一画): energy map with sections (shaded alternately), silences (dark bands) and drop impacts (dashed)', loc='left', fontsize=11, color=INK) if False else a1.set_title('Energy map: mix loudness by section; dark bands = instrumental silences, dashed = impacts', loc='left', fontsize=11, color=INK)
a2.fill_between(t, -70, sm(voc), color=BLUE, alpha=0.18, lw=0, zorder=2); a2.plot(t, sm(voc), color=BLUE, lw=1.5, zorder=4)
a2.set_ylim(-62, -14); a2.set_ylabel('Vocal stem (dBFS)')
xt = np.arange(0, 205, 10); a2.set_xticks(xt); a2.set_xticklabels([f'{int(x//60)}:{int(x%60):02d}' for x in xt]); a2.set_xlim(0, 201.2)
a2.set_xlabel('time (m:ss)  — bar numbers: see timing.json; tempo accelerates 140 → 152 BPM')
plt.tight_layout(); plt.savefig('analysis/energy_plot.png', dpi=110, facecolor=SURF)
