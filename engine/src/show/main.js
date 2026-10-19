// THE SHOW: 一笔一画 · The Vibe Coding Song (201.16 s). One entry per scene module; each owns [t0, t1).
// Section teams: add your entries in your act's block below (keep times keyed to T helpers / cues, never
// hard-coded BPM math). Overlapping ranges are allowed for transitions (the later entry gets `transition`).
export default function show(T) {
  const C = (k) => T.cue('act1.' + k);
  const act1 = [
    // ACT I: CARTRIDGE (0:00 - 0:41.03)
    { id: 'act1.cold_open', t0: 0, t1: C('chant_words')[0], load: () => import('../scenes/act1/cold_open.js') },
    // (v4 Pass B, open_close) the 4 s party menu is now ONE beat: SAVE FILE FOUND · 2011 · CONTINUE? cuts in on beat 4 (6.755,
    // right after the last chant stab's flash) so Jade can press CONTINUE on the 808 hit (7.183); char_select.js keeps its id
    { id: 'act1.paint_run_ship', t0: C('chant_words')[0], t1: T.beat(15), load: () => import('../scenes/act1/paint_run_ship.js') },
    { id: 'act1.char_select', t0: T.beat(15), t1: C('breathy_syllables')[0] - 0.12, load: () => import('../scenes/act1/char_select.js') },
    { id: 'act1.press_start', t0: C('breathy_syllables')[0] - 0.12, t1: C('melisma')[1], load: () => import('../scenes/act1/press_start.js') },
    { id: 'act1.kaizo', t0: C('melisma')[1], t1: C('chorus_downbeat'), load: () => import('../scenes/act1/kaizo.js') },
  ];
  const act2 = [
    // ACT II: VOID / EDITOR (41.028 - 77.76) — Team A (engine owner). Hands off at 77.76 (triplet roll), see HANDOFF_77.md
    { id: 'act2.chorus', t0: T.cue('act1.chorus_downbeat'), t1: T.bar(47), load: () => import('../scenes/act2/chorus.js') },
  ];
  const act3 = [
    // ACT III: Team B (77.76 - 123.35): the launch, THE TURN, Talos world, verse 2, rap. Scenes in src/scenes/act3/
    // measured cues (src/scenes/act3/common.js CUE): 86.385 accent before FIXTURES!, 94.204 verse 2, 107.15 stage, 110.41 rap
    { id: 'act3.turn', t0: T.bar(47), t1: 86.385, load: () => import('../scenes/act3/turn.js') },
    { id: 'act3.drop', t0: 86.385, t1: T.bar(57), load: () => import('../scenes/act3/drop.js') },
    { id: 'act3.verse2', t0: T.bar(57), t1: 107.15, load: () => import('../scenes/act3/verse2.js') },
    { id: 'act3.stage', t0: 107.15, t1: 110.41, load: () => import('../scenes/act3/stage.js') },
    // (v4b stage_3d) card 05 (the paper unit's clip; still 05 as the placeholder until it lands): the 8th 107.238 (世界) -> the beat 107.641 (Jade's stop)
    { id: 'act3.card05', t0: 107.23, t1: 107.62, load: () => import('../scenes/act3/card05.js') },
    { id: 'act3.rap', t0: 110.41, t1: T.section('Bridge').start, load: () => import('../scenes/act3/rap.js') },
  ];
  const act4 = [
    // ACT IV: Team C (123.35 - 173.02): bridge + final chorus. Scenes in src/scenes/act4/ (cues: data/cues.json act4)
    { id: 'act4.main', t0: T.cue('act4.bridge_start'), t1: T.cue('act4.last_hit'), load: () => import('../scenes/act4/main3d.js') },
    { id: 'act4.paper_jade_sing', t0: T.cue('act4.bridge_accent'), t1: T.nearestBeat(T.word(35, 6).start - 0.2), load: () => import('../scenes/act4/paper.js') },
    { id: 'act4.paper_listen', t0: T.nearestBeat(T.word(35, 6).start - 0.2), t1: T.cue('act4.drums_back'), load: () => import('../scenes/act4/paper.js') },
    { id: 'act4.montage', t0: T.cue('act4.eights'), t1: T.cue('act4.pencil_shot'), load: () => import('../scenes/act4/montage.js') },
  ];
  const act5 = [
    // ACT V: Team D (173.02 - end): drop 2, outro, final credits image. Scenes in src/scenes/act5/
    { id: 'act5.drop2', t0: 173.02, t1: 176.6, load: () => import('../scenes/act5/drop2.js') },
    { id: 'act5.aerial', t0: 176.6, t1: 186.65, load: () => import('../scenes/act5/aerial.js') },
    // (v4, ONE ending) the sketchbook page is the end: no separate pixel SAVE COMPLETE screen (act5/title.js + the two
    // torn-paper hand-offs are retired); SAVE COMPLETE · 2026 is a stamp on the page; the picture ends at 203.0 (audio 201.2)
    { id: 'act5.outro', t0: 186.65, t1: 198.035, load: () => import('../scenes/act5/spread.js') }, // its own soft rainbow-pencil wipe over the dive (no core stair edge)
    { id: 'act5.last', t0: 198.035, t1: 203.0, load: () => import('../scenes/act5/spread.js') },
  ];
  const paper = [
    // PAPER INSERTS (v4 Pass B, unit paper): animated paper close-ups cut in over the scene beneath (later overlapping
    // entries, transition cut; the scene underneath takes the frame back on t1). Clips + measured lip sync: scenes/paper_inserts.js
    { id: 'paper.p03', t0: T.snap(20.1667) /* (type M3) pinned: was nearestBeat(T.line(7).start, 2) = 20.167; line 7 now starts at 21.16 ("my"), the cut must not move */, t1: T.snap(T.nearestBeat(23.75)), load: () => import('../scenes/paper_inserts.js') },    // 20.15 -> 23.75 "my imagination is linked"
    { id: 'paper.p04', t0: T.snap(T.nearestBeat(T.line(13).start)), t1: T.snap(T.nearestBeat(50.66)), load: () => import('../scenes/paper_inserts.js') },      // 48.57 -> 50.66 "I just ask myself", then the box
    { id: 'paper.p06', t0: T.snap(T.nearestBeat(T.line(39).start)), t1: T.snap(T.nearestBeat(146.2)), load: () => import('../scenes/paper_inserts.js') },      // 143.40 -> 146.197, before the typing at 146.556
  ];
  const type = [
    // TYPE (v4 Pass B, unit type): lyric type overlays, src/scenes/type/. Each entry renders the scene(s) beneath it
    // and draws its type on top (keep this block LAST so a type entry is always the top entry). The lines drawn here
    // are inWorld in show/subtitles.js (in the world OR in the bar, never both).
    { id: 'type.void', t0: 35.6, t1: 38.6, load: () => import('../scenes/type/overlay.js') },                                   // 说出来 它就存在: code comments under the rows
    { id: 'type.chufa', t0: 73.6, t1: 75.4, load: () => import('../scenes/type/overlay.js') },                                  // 一切从这里出发: code comment under the chant
    { id: 'type.zhan', t0: T.bar(57), t1: T.line(24).end + 0.4, load: () => import('../scenes/type/overlay.js') },             // 绽 (blossoms), one stroke per beat
    { id: 'type.wutai', t0: T.word(27, 3).start - 0.05, t1: 110.41, load: () => import('../scenes/type/overlay.js') },        // 舞台 together on one shot (stage_3d's frame)
    { id: 'type.couplet', t0: T.cue('act4.bridge_start'), t1: T.cue('act4.bridge_accent'), load: () => import('../scenes/type/overlay.js') },   // 是一幅画 | 也是一段代码
    { id: 'type.da', t0: T.cue('act4.bridge_accent'), t1: 128.9, load: () => import('../scenes/type/overlay.js') },   // 答 on the paper card, held over the 128.18 cut through its syllable (128.62)
  ];
  // (type) a type entry must be the TOP entry for its whole window (the runner sorts active entries by t0), so it is split at
  // every scene entry that starts inside it: the type then follows whatever shot another unit puts under it
  const base = [...act1, ...act2, ...act3, ...act4, ...act5, ...paper];
  const onTop = (e) => { const ts = [...new Set(base.map((b) => b.t0).filter((x) => x > e.t0 + 1e-6 && x < e.t1 - 1e-6))].sort((a, b) => a - b);
    const k = [e.t0, ...ts, e.t1]; return k.slice(0, -1).map((a, i) => ({ ...e, id: i ? `${e.id}#${i}` : e.id, t0: a, t1: k[i + 1] })); };
  return [...base, ...type.flatMap(onTop)];
}
