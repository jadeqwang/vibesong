import json, sys
N = json.load(open('work/notes.json')); S = {d['id']: d for d in json.load(open('work/aligned_refined.json'))}; C = {d['id']: d for d in json.load(open('work/ctc_align.json'))}
names = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B']
for i in map(int, sys.argv[1].split(',')):
    a = min(S[i]['words'][0]['start'], C[i]['words'][0]['start']) - 0.8; b = max(S[i]['words'][-1]['end'], C[i]['words'][-1]['end']) + 0.3
    print(f"== line {i}: {S[i]['text']}")
    print('   S: ' + ' '.join(f"{w['w'].strip()}@{w['start']:.2f}" for w in S[i]['words']))
    print('   C: ' + ' '.join(f"{w['w'].strip()}@{w['start']:.2f}" for w in C[i]['words']))
    print('   notes: ' + ' '.join(f"{n['start']:.2f}-{n['end']:.2f}:{names[int(round(n['midi']))%12]}{int(round(n['midi']))//12-1}" for n in N if n['end'] > a and n['start'] < b))
