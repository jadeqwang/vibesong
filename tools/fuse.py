import json, numpy as np
E = np.load('work/env5ms.npz'); V = E['vocals']; T = np.arange(len(V))*0.005
N = json.load(open('work/notes.json')); NS = np.array([n['start'] for n in N]); NE = np.array([n['end'] for n in N])
SR = {d['id']: d for d in json.load(open('work/aligned_refined.json'))}
SRAW = {d['id']: d for d in json.load(open('work/aligned_raw.json'))}
C = {d['id']: d for d in json.load(open('work/ctc_align.json'))}
ST = json.load(open('work/start_test.json'))
def seg(a, b): m = (T >= a) & (T < b); return V[m]
def contrast(t):
    pre = seg(t-0.22, t-0.02); post = seg(t+0.0, t+0.2)
    return float(np.percentile(post, 80) - np.percentile(pre, 30)) if len(pre) and len(post) else 0
def nearest_note(t, w=0.12):
    d = np.abs(NS - t); i = np.argmin(d); return (NS[i], d[i]) if d[i] <= w else (None, d[i])
out = {}
for i in SR:
    cands = {'S_ref': SR[i]['words'][0]['start'], 'S_raw': SRAW[i]['words'][0]['start'], 'CTC': C[i]['words'][0]['start']}
    vetoed = {k for k, v in ST[str(i)].items() if v[1] > 0}
    info = {k: (t, round(contrast(t), 1), nearest_note(t)[0]) for k, t in cands.items()}
    s, c = cands['S_ref'], cands['CTC']
    if abs(s - c) <= 0.25 and not vetoed:
        t0 = (s + c)/2; rule = 'agree'
    else:
        ok = {k: v for k, v in info.items() if k not in vetoed}
        k = max(ok, key=lambda k: ok[k][1]); t0 = ok[k][0]; rule = f'contrast->{k}'
    nn, d = nearest_note(t0, 0.1)
    # also allow an energy-onset (unvoiced consonant) just before the note
    start = nn if nn is not None else t0
    out[i] = dict(start=round(float(start), 3), rule=rule, cands={k: (round(v[0], 2), v[1]) for k, v in info.items()}, vetoed=sorted(vetoed))
    print(f"{i:3d} {SR[i]['text'][:28]:28s} -> {start:7.2f}  [{rule}] " + ' '.join(f"{k}={v[0]:.2f}(c{v[1]:+.0f})" for k, v in info.items()) + (f" veto {sorted(vetoed)}" if vetoed else ''))
json.dump(out, open('work/fused_starts.json', 'w'), indent=1)
