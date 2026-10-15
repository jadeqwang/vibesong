"""Assemble analysis/lyrics_timed.json from the two aligners + per-line decisions (documented in DECIDE) + vocal-stem checks."""
import json, numpy as np
E = np.load('work/env5ms.npz'); V = E['vocals']; T = np.arange(len(V))*0.005
S = {d['id']: d for d in json.load(open('work/aligned_refined.json'))}
C = {d['id']: d for d in json.load(open('work/ctc_align.json'))}
G = json.load(open('work/grid_final.json'))['beats']; GT = np.array([b['t'] for b in G])
def barpos(t):
    j = int(np.searchsorted(GT, t, 'right') - 1); j = max(j, 0)
    per = (GT[j+1]-GT[j]) if j+1 < len(GT) else 0.42
    return f"{G[j]['bar']}.{G[j]['beat']}+{(t-GT[j])/per:.2f}"
# id: (start, base aligner, line confidence, evidence)
DECIDE = {
 1: (4.21, 'S', 'medium', 'shouted chant; S word onsets fall on successive beats (4.19/4.62/5.05/5.48/5.91/6.34); CTC rejected by likelihood test'),
 2: (14.11, 'C', 'high', 'verse register (D4/B3) starts 14.11 on bar 9 downbeat; 13.0-13.8 is the high melisma ending the intro tag'),
 3: (18.10, 'C', 'medium', 'voiced onset of "be-" in spectrogram'),
 4: (20.12, 'S', 'medium', 'new note onset after held "because"; ASR my@20.34'),
 5: (27.80, 'S', 'low', 'onset after held low D3 "life"; aligners disagree 27.96/28.37'),
 6: (31.28, 'S', 'medium', 'onset visible; windowed ASR 31.18'),
 7: (34.69, 'S', 'high', '"sh" fricative onset after held note; bar 21 starts 34.30'),
 8: (38.25, 'C', 'low', 'affricate after gap; aligners 37.60/38.48'),
 9: (41.22, 'S', 'high', 'clear note change after held 来; CTC start lies inside the held note'),
 10: (48.62, 'C', 'high', 'new phrase after long held note; S start lies inside the held note'),
 11: (54.84, 'S', 'high', 'aligners agree (54.88/54.81)'),
 12: (61.30, 'S', 'high', 'preceded by "Oh oh oh" ad-lib run 59.45-61.25 (windowed ASR); ASR And@61.30'),
 13: (72.13, 'C', 'high', 'sharp voiced onset; aligners within 0.25 s'),
 14: (79.36, 'S', 'high', 'aligners agree (79.36/79.37); 画 rings into the silence'),
 15: (86.63, 'S', 'medium', 'F-fricative 86.63, loud vowel 86.75; whistle hook ends ~86.2'),
 16: (89.95, 'S', 'medium', 'whistle ends 89.88-90.08, shout from ~89.95'),
 17: (94.22, 'C', 'high', 'preceded by "Hey, hey, hey" ad-lib 92.56-93.9 (confirmed by likelihood test); on bar 57 downbeat'),
 18: (100.12, 'C', 'medium', 'before 100.12 is a held note'),
 19: (101.00, 'S', 'medium', 'onset visible; same phrasing as verse 1 line'),
 20: (107.15, 'S', 'high', 'aligners agree (107.15/107.16)'),
 21: (110.41, 'S', 'high', 'clear break after held 台; rap starts on bar 67 (110.45)'),
 22: (113.82, 'C', 'medium', 'preceded by "Eh, eh, eh" ad-lib 112.3-113.4 (confirmed)'),
 23: (116.88, 'C', 'medium', 'preceded by short "yeah/eh" ad-lib 115.6-116.8'),
 24: (119.02, 'S', 'medium', 'F-fricative onset visible'),
 25: (123.18, 'S', 'medium', '"sh" onset visible; bridge bar 75 = 123.35'),
 26: (125.86, 'S', 'medium', 'note change after held 码'),
 27: (129.36, 'S', 'high', 'clear onset; CTC start rejected by likelihood test'),
 28: (132.98, 'S', 'medium', 'note change after held 答'),
 29: (135.60, 'S', 'high', 'clear pitch-jump onset; CTC start rejected by likelihood test'),
 30: (143.48, 'C', 'high', 'mirrors chorus 1 (read -> I gap scaled by tempo); S start inside held note'),
 31: (149.22, 'S', 'high', 'clear onset; aligners within 0.15 s'),
 32: (154.26, 'S', 'low', 'held "functions" glide ends ~154.2; aligners 154.26/154.75'),
 33: (165.87, 'C', 'high', 'sharp voiced onset of 一'),
 34: (172.80, 'S', 'high', 'aligners agree (172.80/172.81)'),
 35: (179.76, 'S', 'medium', 'F-fricative 179.76, loud vowel 179.88'),
 36: (183.07, 'C', 'medium', 'F-fricative 183.07, loud vowel 183.28; whistle ends 183.1'),
 37: (186.70, 'S', 'high', 'first vocal after break; aligners 186.70/187.12, onset visible at 186.70'),
 38: (191.30, 'X', 'medium', '"That\'s" onset after held "blossoms" (~191.25), "it" 193.2 (ASR it@193.46)'),
}
def activity_end(t0, tmax, gap=0.12, thr=-42):
    i = int(t0/0.005); last = i; quiet = 0
    while i < len(V) and i*0.005 < tmax:
        if V[i] > thr: last = i; quiet = 0
        else:
            quiet += 1
            if quiet*0.005 > gap: break
        i += 1
    return last*0.005 + 0.02
lines = []
ids = sorted(DECIDE)
for n, i in enumerate(ids):
    st, base, conf, why = DECIDE[i]
    sw, cw = S[i]['words'], C[i]['words']
    if i == 38:
        words = [dict(w="That's", start=191.30, end=193.15, conf='medium'), dict(w='it.', start=193.20, end=193.64, conf='high')]
    else:
        # pair words by order (CTC splits 都是/我的/这里 into chars; regroup to S tokens where needed)
        sws = [w['w'].strip() for w in sw]
        cws = [w['w'] for w in cw]; cst = [w['start'] for w in cw]
        cmap = []; k = 0
        for w in sws:
            L = len(w) if all('一' <= ch <= '鿿' for ch in w) else 1
            if w in ('Fi',): L = 1
            cmap.append(cst[k] if k < len(cst) else None); k += L
            if w == 'Fi': k -= 1
        words = []
        for j, w in enumerate(sw):
            s_t, c_t = w['start'], cmap[j]
            if c_t is None or w['w'].strip() in ('xtures', 'ctions'): t, cf = s_t, 'medium'
            elif abs(s_t - c_t) <= 0.3: t = (s_t + c_t)/2; cf = 'high' if abs(s_t - c_t) <= 0.12 else 'medium'
            else: t = s_t if base == 'S' else c_t; cf = 'low'
            words.append(dict(w=w['w'].strip(), start=round(t, 3), conf=cf))
        # merge split English tokens from zh alignment (Fi+xtures, fun+ctions)
        merged = []
        for w in words:
            if merged and w['w'] in ('xtures', 'ctions'): merged[-1]['w'] += w['w']; continue
            merged.append(w)
        words = merged
        words[0]['start'] = st
        for j in range(1, len(words)):
            if words[j]['start'] <= words[j-1]['start'] + 0.05: words[j]['start'] = round(words[j-1]['start'] + 0.08, 3)
        nxt = DECIDE[ids[n+1]][0] if n+1 < len(ids) else 201.0
        for j in range(len(words)):
            words[j]['end'] = round(words[j+1]['start'] - 0.01, 3) if j+1 < len(words) else None
        last_end = activity_end(words[-1]['start'] + 0.1, min(nxt - 0.03, words[-1]['start'] + 4.0))
        words[-1]['end'] = round(max(last_end, words[-1]['start'] + 0.15), 3)
    ln = S[i]
    a, b = words[0]['start'], words[-1]['end']
    m = (T >= a) & (T < b); pre = (T >= a - 0.25) & (T < a - 0.03)
    lines.append(dict(id=None, src_id=i, section=ln['section'], type=ln['kind'], text=ln['text'], start=round(a, 3), end=round(b, 3),
                      start_bar=barpos(a), confidence=conf, evidence=why,
                      check=dict(vocal_active_frac=round(float((V[m] > -42).mean()), 2), vocal_db_p50=round(float(np.median(V[m])), 1),
                                 pre_onset_db=round(float(np.median(V[pre])), 1), aligner_starts=dict(stable_ts=sw[0]['start'], ctc=cw[0]['start'])),
                      words=words))
# extra vocal events not (or differently) on the lyric sheet
EXTRA = [
 dict(section='Intro', type='hook', text='[whistle-like synth / pitched vocal-chop hook: 4 notes in the rhythm of 一笔一画 (~2 kHz)]', start=0.90, end=3.75, confidence='high (timing) / medium (identity)',
      evidence='pure ~2 kHz tone with vibrato in vocal stem; ASR hears "Beep x4"; no sung lyric', words=[]),
 dict(section='Intro', type='hook', text='[whistle hook, second phrase (~1.18 kHz)]', start=7.60, end=10.62, confidence='high (timing) / medium (identity)',
      evidence='sustained D6 (~1175 Hz) with breathy onsets; ASR hallucinates text; not a lyric', words=[]),
 dict(section='Intro', type='chant', text='一笔 一画', start=11.12, end=12.86, confidence='medium',
      evidence='breathy/whispered; zh ASR "一比一坏" (homophone); likelihood 一笔一画 >> alternatives; high melisma tail 12.95-13.82',
      words=[dict(w='一', start=11.12, end=11.38, conf='medium'), dict(w='笔', start=11.40, end=11.74, conf='medium'), dict(w='一', start=11.76, end=12.28, conf='low'), dict(w='画', start=12.30, end=12.86, conf='medium')]),
 dict(section='Chorus 1', type='adlib', text='(Oh, oh, oh, oh, oh)', start=59.45, end=61.25, confidence='medium', evidence='windowed ASR, melodic run after "functions"', words=[]),
 dict(section='Post-Chorus Drop 1', type='hook', text='[whistle hook phrase]', start=81.87, end=86.15, confidence='high', evidence='1.3-2.0 kHz pure tone in vocal stem (pyin)', words=[]),
 dict(section='Post-Chorus Drop 1', type='hook', text='[whistle hook answer]', start=88.48, end=89.88, confidence='high', evidence='pyin', words=[]),
 dict(section='Post-Chorus Drop 1', type='adlib', text='(Hey, hey, hey)', start=92.56, end=93.90, confidence='medium', evidence='windowed ASR + likelihood test; pickup into verse 2',
      words=[dict(w='Hey', start=92.56, end=92.9, conf='medium'), dict(w='hey', start=93.18, end=93.5, conf='medium'), dict(w='hey', start=93.58, end=93.9, conf='medium')]),
 dict(section='Rap Verse', type='adlib', text='(Eh, eh, eh)', start=112.30, end=113.40, confidence='medium', evidence='full ASR + likelihood test', words=[]),
 dict(section='Rap Verse', type='adlib', text='(Yeah / eh)', start=115.60, end=116.80, confidence='low', evidence='full ASR heard "Eh, eh, eh", likelihood prefers "Yeah"', words=[]),
 dict(section='Post-Chorus Drop 2', type='hook', text='[whistle hook phrase]', start=174.78, end=179.31, confidence='high', evidence='pyin', words=[]),
 dict(section='Post-Chorus Drop 2', type='hook', text='[whistle hook answer]', start=181.12, end=183.10, confidence='high', evidence='pyin', words=[]),
 dict(section='Outro', type='chant', text='(一笔一画!) — processed/pitched tag', start=199.20, end=200.80, confidence='low',
      evidence='4 vocal-stem bursts 199.25/199.55/200.15/200.45; ASR "B.B.B.Y" (yi-bi-yi-hua); heavily processed, may be a chop', words=[]),
]
for e in EXTRA:
    e['start_bar'] = barpos(e['start']); lines.append(dict(id=None, src_id=None, **e))
lines.sort(key=lambda x: x['start'])
CHANT_END = {15: (S[15]['words'][-1]['end'] + C[15]['words'][-1]['end'])/2, 16: (S[16]['words'][-1].get('end_raw', S[16]['words'][-1]['end']) + C[16]['words'][-1]['end'])/2,
             35: (S[35]['words'][-1].get('end_raw', S[35]['words'][-1]['end']) + C[35]['words'][-1]['end'])/2, 36: (S[36]['words'][-1].get('end_raw', S[36]['words'][-1]['end']) + C[36]['words'][-1]['end'])/2}
for l in lines:
    if l['src_id'] in CHANT_END:
        l['end'] = round(CHANT_END[l['src_id']], 3); l['words'][-1]['end'] = l['end']
def accent(t0, t1, thr=-32):
    i0, i1 = int(t0/0.005), int(t1/0.005); k = np.where(V[i0:i1] > thr)[0]
    return round((i0 + k[0])*0.005, 3) if len(k) else None
for l in lines:
    if l['type'] == 'chant' and l['words']:
        l['vocal_accent'] = accent(l['start'], l['start'] + 1.0)
for l in lines:
    if l['src_id'] == 15: l['end'] = round(activity_end(l['vocal_accent'], 88.4, thr=-38), 3); l['words'][-1]['end'] = l['end']
    if l['src_id'] == 35: l['end'] = round(activity_end(l['vocal_accent'], 181.1, thr=-38), 3); l['words'][-1]['end'] = l['end']
sung = [l for l in lines if l['type'] != 'hook']
for a, b in zip(sung, sung[1:]):
    if a['end'] > b['start'] - 0.02:
        a['end'] = round(b['start'] - 0.02, 3)
        if a['words']: a['words'][-1]['end'] = a['end']
        a['end_capped_by_next_event'] = True
for l in lines:
    if 'check' in l:
        m = (T >= l['start']) & (T < l['end'])
        l['check']['vocal_active_frac'] = round(float((V[m] > -42).mean()), 2); l['check']['vocal_db_p50'] = round(float(np.median(V[m])), 1)
for k, l in enumerate(lines, 1): l['id'] = k
out = dict(
  audio='inputs/The Vibe Coding song (一笔一画).mp3', time_base='seconds from first decoded sample (ffmpeg/NLE timeline; MP3 start_time 0.023 s is encoder delay already trimmed)',
  method=['demucs htdemucs_ft vocal stem', 'faster-whisper large-v3 free transcription (en, zh) + windowed re-transcription',
          'Whisper large-v3 teacher-forced likelihood tests of candidate texts', 'stable-ts forced alignment (Whisper large-v3) of canonical text per line',
          'independent CTC forced alignment (torchaudio MMS_FA, pinyin for Mandarin)', 'per-line arbitration by vocal-stem spectrogram/note onsets; vocal-energy checks'],
  notes=['Text is canonical (lyric sheet / embedded Suno lyrics) as actually performed; ASR mishearings (全世界, 被, 阿弟...) corrected to canonical.',
         'Performed structure differs from the .md sheet: "I just ask myself..." is sung ONCE per chorus (embedded tag lists it twice); the in-chorus (一笔一画!) chant after "need?" is NOT performed; bridge couplet is sung twice; intro 一笔 一画 is breathy at 11.1 s (after "Paint it, run it, ship it!"), not before it.',
         '(一笔一画!) chants at 79.36 and 172.80 lead straight into the silences before each drop; (Fixtures!)/(Functions!) are shouted inside the drops between whistle-hook phrases.',
         'Word "end" = next word start (legato) except the last word, whose end is measured from vocal-stem activity. Word confidence: high = aligners within 0.12 s, medium = within 0.3 s or single-source, low = aligners disagree (base aligner used).',
         'vocal_accent (chants) = first 5 ms frame where the vocal stem exceeds -32 dBFS after the start, i.e. the loud hit of a shout (consonant onsets can be 0.1-0.5 s earlier and quiet).', 'check.vocal_active_frac = fraction of 5 ms frames inside the line where the vocal stem is above -42 dBFS; pre_onset_db = vocal level 30-250 ms before the start (low value = clean onset).'],
  lines=lines)
json.dump(out, open('analysis/lyrics_timed.json', 'w'), ensure_ascii=False, indent=1)
for l in lines:
    print(f"{l['id']:3d} {l['start']:7.2f}-{l['end']:7.2f} [{l['start_bar']:>10s}] {l['confidence'][:6]:6s} {l['type']:6s} {l['text'][:50]:50s} act {l.get('check',{}).get('vocal_active_frac','-')} pre {l.get('check',{}).get('pre_onset_db','-')}")
