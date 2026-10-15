import json, re, numpy as np
asr = json.load(open('work/asr.json')); al = json.load(open('work/aligned_refined.json'))
W = []
for lang in ('en', 'zh'):
    for s in asr[lang]:
        for w in s['words']: W.append((lang, w['w'].strip(), w['start'], w['end'], w['p']))
def norm(s): return re.sub(r"[^\w一-鿿]", '', s.lower())
for ln in al:
    first = norm(ln['words'][0]['w']); last = norm(ln['words'][-1]['w'])
    def find(tok, t0, key):
        c = [(abs(w[key]-t0), w) for w in W if norm(w[1]) and (norm(w[1]).startswith(tok[:3]) or tok.startswith(norm(w[1])[:3])) and abs(w[key]-t0) < 2.5]
        return min(c, key=lambda x: x[0])[1] if c else None
    f = find(first, ln['start'], 2); l = find(last, ln['end'], 3)
    fs = f"{f[0]}:{f[1]}@{f[2]:.2f}(p{f[4]:.2f}) d={ln['start']-f[2]:+.2f}" if f else '-'
    ls = f"{l[0]}:{l[1]}@{l[3]:.2f} d={ln['end']-l[3]:+.2f}" if l else '-'
    flag = ' <<<' if (f and abs(ln['start']-f[2]) > 0.3) or (l and abs(ln['end']-l[3]) > 0.4) else ''
    print(f"{ln['id']:3d} {ln['start']:7.2f}-{ln['end']:7.2f} {ln['text'][:28]:28s} | first {fs:40s} | last {ls}{flag}")
