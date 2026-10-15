"""Refine stable-ts word timings against the vocal stem: fix smeared first words (low p / overlong) by snapping to
vocal onsets, trim word ends to vocal activity, and report per-word vocal-energy coverage."""
import json, numpy as np, librosa
sr = 44100; hop = 220
v = librosa.load('work/demucs/htdemucs_ft/song/vocals.wav', sr=sr, mono=True)[0]
env = 20*np.log10(np.sqrt(np.convolve(v**2, np.ones(hop*4)/(hop*4), mode='same'))[::hop] + 1e-9)  # 20 ms RMS @5 ms
T = np.arange(len(env))*hop/sr
oenv = librosa.onset.onset_strength(y=v, sr=sr, hop_length=hop)
on = librosa.onset.onset_detect(onset_envelope=oenv, sr=sr, hop_length=hop, backtrack=True, units='time')
np.save('work/vocal_onsets.npy', on)
ACT = -42.0
def cov(a, b):
    m = (T >= a) & (T < b); return float((env[m] > ACT).mean()) if m.any() else 0.0
def syl(w):
    w = w.strip(" ,.!?'")
    if any('一' <= ch <= '鿿' for ch in w): return len(w)
    return max(1, len([1 for i,ch in enumerate(w.lower()) if ch in 'aeiouy' and (i == 0 or w.lower()[i-1] not in 'aeiouy')]))
lines = json.load(open('work/aligned_raw.json'))
for ln in lines:
    W = ln['words']
    for k, w in enumerate(W):
        dur = w['end'] - w['start']; est = 0.16*syl(w['w']) + 0.12
        smeared = (w['p'] < 0.25 and dur > est*1.6) or dur > max(1.2, est*3)
        nxt = W[k+1]['start'] if k+1 < len(W) else None
        if smeared and k == 0:
            # onset nearest to expected start, inside window, before end
            exp = w['end'] - est*1.3
            c = on[(on >= ln['win'][0]) & (on < w['end'] - 0.08)]
            new = c[np.argmin(np.abs(c - exp))] if len(c) else exp
            if abs(new - exp) > 0.45: new = exp
            w['start_raw'] = w['start']; w['start'] = round(float(max(new, w['start'])), 3); w['fixed'] = 'start->onset'
        elif smeared:
            w['flag'] = 'long'
        # trim end to last active frame (keep >=60 ms)
        m = (T >= w['start']) & (T < w['end']); idx = np.where(m & (env > ACT))[0]
        if len(idx) and T[idx[-1]] + 0.03 < w['end'] - 0.15 and k == len(W)-1:
            w['end_raw'] = w['end']; w['end'] = round(float(max(T[idx[-1]] + 0.03, w['start'] + 0.06)), 3); w['fixed'] = w.get('fixed', '') + ' end->activity'
        w['vocal_cov'] = round(cov(w['start'], w['end']), 2)
        w['vocal_db'] = round(float(np.percentile(env[(T >= w['start']) & (T < w['end'])], 90)), 1) if w['end'] > w['start'] else None
    ln['start'] = W[0]['start']; ln['end'] = W[-1]['end']
    ln['onset_dev_ms'] = round(1000*float(np.min(np.abs(on - ln['start']))), 0)
    ln['line_cov'] = round(cov(ln['start'], ln['end']), 2)
    ln['pre_db'] = round(float(np.median(env[(T >= ln['start']-0.25) & (T < ln['start']-0.05)])), 1)
    ln['in_db'] = round(float(np.median(env[(T >= ln['start']+0.02) & (T < ln['start']+0.25)])), 1)
    print(f"{ln['id']:3d} {ln['start']:7.2f}-{ln['end']:7.2f} cov {ln['line_cov']:.2f} pre {ln['pre_db']:6.1f} in {ln['in_db']:6.1f} onsetdev {ln['onset_dev_ms']:4.0f}ms  {ln['text'][:34]:34s} " +
          ' '.join(f"{w['w'].strip()}[{w['start']:.2f}{'*' if 'fixed' in w else ''} {w['vocal_cov']:.1f}{' L' if 'flag' in w else ''}]" for w in W))
json.dump(lines, open('work/aligned_refined.json', 'w'), ensure_ascii=False, indent=1)
