// THE SHOW: 一笔一画 · The Vibe Coding Song (201.16 s). One entry per scene module; each owns [t0, t1).
// Section teams: add your entries in your act's block below (keep times keyed to T helpers / cues, never
// hard-coded BPM math). Overlapping ranges are allowed for transitions (the later entry gets `transition`).
export default function show(T) {
  const C = (k) => T.cue('act1.' + k);
  const act1 = [
    // ACT I: CARTRIDGE (0:00 - 0:41.03)
    { id: 'act1.cold_open', t0: 0, t1: C('chant_words')[0], load: () => import('../scenes/act1/cold_open.js') },
    { id: 'act1.paint_run_ship', t0: C('chant_words')[0], t1: C('bar5_hit'), load: () => import('../scenes/act1/paint_run_ship.js') },
    { id: 'act1.char_select', t0: C('bar5_hit'), t1: C('breathy_syllables')[0] - 0.12, load: () => import('../scenes/act1/char_select.js') },
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
    { id: 'act5.outro', t0: 186.65, t1: 194.31, load: () => import('../scenes/act5/spread.js') }, // its own soft rainbow-pencil wipe over the dive (no core stair edge)
    { id: 'act5.title', t0: 194.06, t1: 198.235, load: () => import('../scenes/act5/title.js') },
    { id: 'act5.last', t0: 198.035, t1: 207.2, load: () => import('../scenes/act5/spread.js') },
    // torn-paper hand-offs (own composite of the two neighbours; must stay AFTER the entries they cover)
    { id: 'act5.tear_title', t0: 194.06, t1: 194.42, load: () => import('../scenes/act5/tear.js') },
    { id: 'act5.tear_last', t0: 198.035, t1: 198.40, load: () => import('../scenes/act5/tear.js') },
  ];
  return [...act1, ...act2, ...act3, ...act4, ...act5];
}
