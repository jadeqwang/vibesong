import json, numpy as np, soundfile as sf, scipy.signal as ss
G = json.load(open('work/grid_final.json')); beats = G['beats']; GT = np.array([b['t'] for b in beats])
F = json.load(open('work/facts.json')); ST = {r['name']: r for r in json.load(open('work/section_stats.json'))}
info = sf.info('work/song.wav')
# grid verification: strong drum onsets vs nearest grid subdivision (8th / triplet / 16th)
T, O = np.load('work/drum_onset_env.npy'); med = np.median(O)
pk = ss.find_peaks(O, height=8*med, distance=8)[0]; ot = T[pk]; ot = ot[(ot > 0.2) & (ot < 187.0)]
devs = []; sub = []
for t in ot:
    j = int(np.searchsorted(GT, t) - 1); j = max(0, min(j, len(GT)-2)); per = GT[j+1]-GT[j]; x = (t-GT[j])/per
    cands = {'beat': [0, 1], '8th': [0.5], 'triplet': [1/3, 2/3], '16th': [0.25, 0.75]}
    best = min(((abs(x-c)*per, k) for k, cs in cands.items() for c in cs)); devs.append(best[0]); sub.append(best[1])
devs = np.array(devs)
verify = dict(strong_drum_onsets=int(len(ot)), within_15ms_of_grid_subdivision=round(float((devs < 0.015).mean()), 3),
              within_25ms=round(float((devs < 0.025).mean()), 3), median_dev_ms=round(float(np.median(devs)*1000), 1),
              by_subdivision={k: int(sub.count(k)) for k in ('beat', '8th', 'triplet', '16th')}, spline_fit=G['fit'])
SECT = [
 ('Intro A', 0.0, 7.183, 1, 4, 3, 'Synth pad + sparse kicks; 4-note whistle hook (0.90-3.75); shouted "Paint it, run it, ship it!" (4.21-6.91) with drum stabs on the words; no bass.'),
 ('Intro B', 7.183, 14.012, 5, 8, 4, '808 bass enters 7.01 (bar 5 hit 7.18); whistle hook 2nd phrase (7.60-10.62, ~1.18 kHz); breathy "一笔 一画" (11.12-12.86) + high melisma tail to 13.82.'),
 ('Verse 1', 14.012, 34.298, 9, 20, 5, 'Full trap groove (kick 14.025); sultry low lead (B3-D4). Instrument stops under vocal at 16.73-17.38 and 23.70-24.20; stutter gaps 29.2-30.8; Mandarin lines from 27.80.'),
 ('Pre-Chorus', 34.298, 41.028, 21, 24, 6, 'Lift: chopped stops 35.88-36.89 (several 0.1-0.2 s cuts), vocal climbs to A4/B4 on 来 (40.1-41.6).'),
 ('Chorus 1', 41.028, 67.778, 25, 40, 7, 'Belted English hook; instrumental stop 43.89-44.45 under "read"; "Oh oh oh" run 59.45-61.25; held "there" to ~67.9.'),
 ('Chorus 1 tag / build (snare roll -> silence)', 67.778, 80.81, 41, 48, 7, 'Drums thin out, synths swell (other stem +6 dB); chant 一切从这里出发 72.13; hats/snare densify into triplet roll 77.76-79.4; chant 一笔一画 79.36; last hit ~79.64; FULL SILENCE 79.87-80.805 (0.935 s) with only the 画 vocal tail.'),
 ('Post-Chorus Drop 1', 80.81, 94.204, 49, 56, 9, 'Hard instrumental chant-drop: drums 80.81 (8th-note anticipation of bar 49 downbeat 81.058), 808 80.99; whistle hook 81.87-86.15; shouted "Fixtures!" (loud 86.87) over stop 87.26-87.81; whistle answer 88.48-89.88; "Functions!" 89.95 then stop 90.375-91.085; "Hey hey hey" pickup 92.56.'),
 ('Verse 2', 94.204, 110.450, 57, 66, 6, 'Groove returns; lead from bar 57 downbeat (94.22); 世界 是我的舞台 107.15 over three stutter stops 107.6-109.3.'),
 ('Rap Verse', 110.450, 123.354, 67, 74, 7, 'Fast Mandarin rap (10 syllables/s); accent hits on beat 4 of bars 67/69/71/73 (111.66, 114.90, 118.12, 121.34); "Eh eh eh" 112.3, "yeah" 115.6.'),
 ('Bridge (stripped, half-time)', 123.354, 136.212, 75, 82, 4, 'Drums/808 drop out 124.5-129.3 (stripped, sultry); drums return ~130 at half-time feel, triplet fill 135.0-136.1; couplet sung twice (123.18 / 129.36).'),
 ('Final Chorus', 136.212, 161.728, 83, 98, 8, 'Vocal pickup 135.60; band cuts 137.47-138.90 under "I think about stuff I read", lone hit 138.905, cut again 139.06-139.70, FULL SLAM 139.70; gang-vocal energy; melodic lift (+2 st on "I think...", +7 st on "And everything goes"); no harmonic key change; 16th snare-roll fill 160.9-161.7.'),
 ('Final Chorus tag / build (roll -> silence)', 161.728, 174.395, 99, 106, 8, 'Synth swell, 一切从这里出发 165.87; dense 8ths from ~168.1; 一笔一画 172.80; last hit 173.02; FULL SILENCE 173.41-174.00 (0.59 s) with 画 vocal 173.64-174.4 bridging the gap.'),
 ('Post-Chorus Drop 2', 174.395, 187.039, 107, 114, 10, 'Biggest drop: drums 174.395 on bar 107 downbeat (174.418), 808 174.62; whistle hook 174.78-179.31; "Fixtures!" loud 180.23 over stop 180.50-181.12; whistle answer 181.12-183.10; "Functions!" 183.07; stop 183.72-184.27; 16th riser 184.3-187.0.'),
 ('Outro', 187.039, 201.19, 115, 122, 3, 'Drums out; sustained pad + 808, free-time lead "Everything I love about life just blossoms" (186.70) and "that\'s it." (191.30/193.20); synth pulse 194.06; tag hit 197.61, micro-silence 197.78-198.03, final drum tag 198.035 (~141 BPM) with processed 一笔一画 chop 199.2-200.8; audio ends ~201.2.'),
]
sections = []
for n, a, b, b0, b1, en, desc in SECT:
    s = ST[n]
    sections.append(dict(name=n, start=a, end=b, start_bar=b0, end_bar=b1, bars=b1-b0+1, energy_1_10=en, description=desc,
                         loudness_db=dict(mix=round(s['mix'], 1), drums=round(s['drums'], 1), bass=round(s['bass'], 1), other=round(s['other'], 1), vocals=round(s['vocals'], 1))))
bars_e = F['bars_energy']; mx = np.array([b['mix_db'] for b in bars_e])
for b in bars_e: b['energy_0_1'] = round(float((b['mix_db'] - mx.min())/(mx.max() - mx.min())), 3)
tempo_curve = [dict(bar=b['bar'], t=b['t'], bpm=b['bpm']) for b in beats if b['beat'] == 1]
out = dict(
 audio=dict(file='inputs/The Vibe Coding song (一笔一画).mp3', duration_s=round(info.frames/info.samplerate, 3), container_duration_s=201.19,
            native_sample_rate=48000, time_base='seconds from the first decoded sample (what an NLE shows); MP3 start_time 0.023 s encoder delay is trimmed by the decoder',
            end_of_audible_s=201.2),
 tempo=dict(nominal_bpm_suno=140, measured='smooth accelerando: 140.2 BPM at 0:00 -> 143.5 (0:51) -> 146.0 (1:24) -> 149.3 (1:57) -> 151.1 (2:45) -> 152.3 BPM (3:01); then rubato outro (~137 BPM nominal, no drums) 187.0-194.1, synth pulse ~134 BPM 194.1-197.6, final tag ~141 BPM.',
            feel='trap half-time: kick on 1, snare on 3 of each 4-beat bar at the 140-level; a "half-time pulse" = every other beat.',
            warning='Do NOT use a fixed 140 BPM grid: by 3:00 it would be ~5 beats (~2 s) early. Use beat_grid below.', curve_per_bar=tempo_curve),
 beat_grid=dict(convention='4/4 at the ~140-152 BPM level; bar 1 beat 1 = first downbeat at 0.343 s; zone=measured (drum-onset anchored spline), nominal_rubato (no pulse, evenly spaced placeholder), measured_outro.',
                verification=verify, beats=beats, downbeats=[b['t'] for b in beats if b['beat'] == 1]),
 sections=sections,
 silences=dict(
   full_instrumental=F['full_instrumental_silences'], drums_and_bass_out=F['beat_dropouts'],
   key_gaps=[dict(label='beat of silence before Drop 1', start=79.87, end=80.805, dur=0.935, note='mix falls to -64 dBFS; only the 画 vocal tail sounds until ~80.85'),
             dict(label='silence before Drop 2', start=173.41, end=174.0, dur=0.59, note='drums/synth stop after last hit 173.02; 画 vocal 173.64-174.4 bridges; impact 174.395'),
             dict(label='final-chorus stop 1', start=137.47, end=138.90, dur=1.43, note='vocal "I think about stuff I read" continues a cappella-ish'),
             dict(label='final-chorus stop 2', start=139.06, end=139.70, dur=0.64, note='then full slam 139.70'),
             dict(label='outro micro-silence', start=197.78, end=198.03, dur=0.25, note='between tag hit 197.61 and final drum tag 198.035')]),
 drops=[dict(name='Drop 1', silence=[79.87, 80.805], impact_s=80.81, onset_peak_s=80.856, bass_808_s=80.99, bar_downbeat_s=81.058, bar=49,
             note='band re-enters an 8th note before the bar-49 downbeat (anticipation); cut on 80.81-80.86'),
        dict(name='Final Chorus slam', impact_s=139.70, pickup_hit_s=138.905, bar=85, bar_downbeat_s=139.411, note='slam lands a 16th before beat 2 of bar 85'),
        dict(name='Drop 2', silence=[173.41, 174.0], last_hit_before_s=173.022, impact_s=174.395, bass_808_s=174.62, bar_downbeat_s=174.418, bar=107, note='on the downbeat; loudest section of the song'),
        dict(name='Outro tag', impact_s=198.035, pre_hit_s=197.606, silence=[197.78, 198.03], bar=121)],
 snare_rolls_builds=[dict(start=77.76, end=79.4, note='hat/snare densify into triplets (bar 47-48), cut ~79.6-79.85 into the silence'),
                     dict(start=160.9, end=161.7, note='16th-note snare roll fill ending the final chorus'),
                     dict(start=168.1, end=172.95, note='dense 8th-note build (bars 103-106), cut after hit 173.02'),
                     dict(start=184.3, end=187.0, note='16th-note synth riser out of Drop 2 into the outro')],
 key=dict(tonal_center='A (A minor / A Dorian); verses lean on D major (IV), bridge moves E minor -> C -> G -> D before returning to A at 136',
          key_change=None,
          key_change_evidence='Chroma of harmonic stems (other+bass) Chorus 1 vs Final Chorus correlate r=0.935 at 0 semitones (every other shift r<=0.05); same for drop 1 vs drop 2 (0.932) and build 1 vs build 2 (0.933). The Suno "key-change final chorus" was not realized harmonically.',
          perceived_lift=[dict(t=135.60, what='final chorus vocal pickup after bridge (bridge sits in E minor/G, return to A)'),
                          dict(t=139.70, what='full-band slam'),
                          dict(t=135.60, what='"I think about stuff I read" sung ~+2 semitones higher than chorus 1'),
                          dict(t=154.26, what='"And everything goes from there" sung ~+7 semitones higher (belt) than chorus 1')]),
 hooks=dict(whistle_like_hook_segments=F['whistle_hook_segments'],
            note='The whistle-like synth hook (pure ~1.2-2.1 kHz tone) leaks into the demucs vocal stem; it carries the 4-note 一笔一画 motif in the intro and the call/answer phrases in both drops.'),
 accent_hits=[dict(t=h['t'], bar=h['bar'], beat=h['beat'], off_grid_ms=h['off_grid_ms'], strength_x_median=h['strength']) for h in F['top_transients']],
 energy=dict(per_bar=bars_e, note='dB = mean power of 5 ms RMS frames over the bar (dBFS); energy_0_1 = min-max normalized mix level'),
)
json.dump(out, open('analysis/timing.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(verify, indent=1)); print('duration', out['audio']['duration_s'])
