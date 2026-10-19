// BATTLE UI (second half, docs/game_design_acts3-5.md "The battle system"): the 2D JRPG overlay that drops into the
// 3D world for the bug battle (107.15-123.35), THE ERASER's warning (123.18) and the final-boss menu (143.48-154.24).
// Owner: BATTLE UI team. PURE function of song time t (like build_bar.js): every frame renders identically in any
// worker and in any order. Everything time-related is in the tables at the top of this file.
//
// Look: the concept mocks (engine/out/mocks/half2/m1..m3, source _work/ui.py): Dragon Quest / FF windows in the half-1
// HUD palette, Fusion Pixel fonts, drawn on ONE 384x216 canvas that is scaled 5x (1080p) without smoothing.
// Windows live in the bottom band (y 159..213 of 216); short pop-ups (SKILLS cascade, the > text field, tech banner,
// VICTORY) sit in the strip just above it (y 141..158). Never over faces.
//
// API (full doc: engine/WORLD_API.md "Battle UI")
//   import { makeBattleUI, battleAt, battleOwnsSubs, BATTLE } from '../../show/battle_ui.js';
//   const bui = await makeBattleUI(ctx);                 // once in setup (loads fonts, builds portraits)
//   bui.update(t, { anchors, camera, nameTags })          // every frame; anchors position the floating tags
//   make3D frame(): return { ..., ui2d: bui.ui2d, noSubs: battleOwnsSubs(t) }
//   act4 main3d:    api.suppressSubs = battleOwnsSubs(t); after its render: bui.render(renderer, target)
//   battleAt(t) -> { visible, phase, hearts, full, converted, active, party, cmd, banner, ownsSubs, ... }
//   bui.project(vec3, camera) -> [u, v]  (0..1 screen, top-left origin) for anchors
import * as THREE from 'three';
import * as T from './timing.js';
import { raster, loadFonts } from '../core/text.js';
import { SUBS } from './subtitles.js';
import { flowerCanvas } from '../core/props.js';
import { jadePortraitHairDown, clearFrameAt } from '../core/ui.js';
import { Quad } from '../core/gfx.js';
import { R5 } from '../scenes/act3/common.js';   // (r5) round-5 flag: the r5 tables / layouts below apply only with --r5

// =================================================================== THE TIMELINE (song time, measured cues)
// Cues: src/scenes/act3/common.js CUE (stage stops 107.615/108.195/108.835; rap accents 111.705, 112.515, 114.95,
// 118.175, 118.38, 121.405; eh eh eh 112.33/112.56/112.78), analysis/lyrics_timed.json word times, timing.json beats
// (8th ~ 0.2015 s, half-bar ~ 0.806 s), data/cues.json act4.
const E8 = 0.2015;
export const BATTLE = {
  // ---- windows
  enc: 107.15,            // 世界: the 4-frame pixel-grid swirl starts here
  swirlFrames: 4,
  open: 107.283,          // windows slide up after the swirl (107.15 + 4 frames)
  openDur: 0.18,
  close: 122.95,          // slide away (band shot)
  closeDur: 0.22,
  ownsSubs: [[107.03, 123.41], [143.36, 154.49]],   // the message window IS the subtitle in these ranges (123.41: line 33's
                                                    // hold ends; act3/act4 currentSub would otherwise pop the stale line 33 back for 0.23 s)
  // ---- party intros (stage stops: each spotlight slam pops that hero's row)
  intro: { jade: 107.615, charlie: 108.195, ricky: 108.835 },
  // ---- enemies (109.14 舞台: the list fills one name per 8th, empty ♥)
  enemiesIn: 109.14,
  enemies: [
    { id: 'ladybug', name: 'LADYBUG', feature: 'BUTTON', fsprite: 'bug_ladybug_button' },
    { id: 'beetle', name: 'BEETLE', feature: 'WHEEL', fsprite: 'bug_beetle_wheel' },
    { id: 'moth', name: 'MOTH', feature: 'GLIDER', fsprite: 'bug_moth_glider' },
    { id: 'caterpillar', name: 'CATERPILLAR', feature: 'BRIDGE', fsprite: 'bug_caterpillar_bridge' },
    { id: 'firefly', name: 'FIREFLY', feature: 'LAMP', fsprite: 'bug_firefly_lamp' },
  ],
  hearts: 5,              // ♥ meter size
  victory: 119.02,        // enemy window closes, ★ VICTORY ★
  // ---- recruit (121.405 accent): DQ prompt, Charlie's button = YES on the next 8th, then one recruit per 8th
  recruit: { t0: 121.405, yes: 121.745, joins: [121.946, 122.147, 122.348, 122.549, 122.75], order: ['firefly', 'moth', 'beetle', 'caterpillar', 'ladybug'] },
  // ---- bridge
  near: { t0: 123.18, t1: 124.45, text: 'THE ERASER draws near!' },
  // ---- final boss (143.48 command window, `> an eraser`, ENTER on "need" 147.358, joins at 149.22 "That's it")
  final: { open: 143.48, enemyIn: 147.6, join: 149.22, close: 154.24 },
};

/** active (highlighted) heroes per turn: [t, [ids]] — the first id is the one that acts first */
export const ACTIVE = [
  [107.615, ['jade']], [108.195, ['charlie']], [108.835, ['ricky']], [109.14, []],
  [110.41, ['jade']],                       // Turn 1 JADE: 不用背语法 我只说出想法
  [112.07, []], [112.33, ['ricky', 'charlie']],   // Turn 2 FIREFLY: ON BEAT (RUN + SHIP)
  [113.68, []], [113.82, ['jade', 'ricky']],      // Turn 3 MOTH: UPDRAFT (PAINT + RUN)
  [115.30, []], [115.6, ['jade', 'charlie']],     // Turn 4 BEETLE: BREAK (PAINT + SHIP)
  [116.88, []], [117.23, ['charlie']], [117.65, ['jade', 'ricky', 'charlie']],   // Turn 5 BOSS: GUARD, triple tech
  [119.02, []], [121.745, ['charlie']], [122.0, []],
  [143.48, ['jade']], [147.6, ['jade', 'ricky', 'charlie']], [149.22, []],
];
/** a hero acts: white flash on their portrait (item-slot flash, half-1 HUD grammar) */
export const ACTS = [
  [111.705, 'jade'], [112.33, 'ricky'], [112.56, 'ricky'], [112.78, 'ricky'], [113.28, 'charlie'],
  [113.82, 'jade'], [114.95, 'ricky'], [115.6, 'jade'], [116.11, 'charlie'], [116.51, 'charlie'],
  [117.23, 'charlie'], [118.017, 'jade'], [118.175, 'ricky'], [118.278, 'jade'], [118.38, 'charlie'],
  [121.745, 'charlie'], [147.358, 'jade'], [148.191, 'jade'], [148.59, 'ricky'], [148.989, 'charlie'],
];
/** ♥ meter events [t, enemy id, +n]. Each one also floats a ♥+n tag at that enemy's anchor. */
export const HEARTS = [
  ...['ladybug', 'beetle', 'moth', 'caterpillar', 'firefly'].map((id, i) => [111.705 + 0.05 * i, id, 1]),   // > let's dance: they sway
  [112.33, 'firefly', 1], [112.56, 'firefly', 1], [112.78, 'firefly', 1], [113.28, 'firefly', 1],      // eh eh eh, hat = lampshade
  [113.82, 'moth', 1], [114.035, 'moth', 1], [114.597, 'moth', 1], [114.95, 'moth', 1],               // wings coloured, updraft
  [115.6, 'beetle', 2], [116.11, 'beetle', 1], [116.51, 'beetle', 1],                                  // 丨 axle, boomerang, break;
  ...[118.017, 118.175, 118.278, 118.38].flatMap((t) => [[t, 'ladybug', 1], [t + 0.03, 'caterpillar', 1]]),   // 草 run 稿 ship
  [147.358, 'eraser', 1], [147.793, 'eraser', 1], [148.191, 'eraser', 1], [148.59, 'eraser', 1], [148.989, 'eraser', 1],
];
/** bug -> feature (name swaps to the feature, BUG → FEATURE tag) */
export const CONVERT = [[113.28, 'firefly'], [114.95, 'moth'], [116.51, 'beetle'], [118.469, 'caterpillar'], [118.659, 'ladybug']];
/** extra floating tags [t, kind, target]: kind 'miss' | 'guard' */
export const TAGS = [
  [111.705, 'miss', 'jade'], [112.33, 'miss', 'jade'], [112.56, 'miss', 'jade'],    // the syntax books land around her
  [117.23, 'guard', 'charlie'], [117.311, 'miss', 'jade'], [117.406, 'miss', 'ricky'],  // 也不怕: the wave hits nobody
];
/** the message window's third line (battle text). '' clears it. */
export const ACTION = [
  [107.283, ''], [109.14, 'BUGS ×5 draw near!'],
  [110.41, 'BUGS cast SYNTAX!', 'red'], [111.705, 'MISS ×3 · every BUG ♥+1'],
  [112.07, 'FIREFLY blinks off the beat!', 'red'], [112.33, 'RUN + SHIP · ON BEAT'], [113.28, 'FIREFLY → LAMP', 'green'],
  [113.68, 'MOTH dives at the lights!', 'red'], [113.82, 'PAINT + RUN · UPDRAFT'], [114.95, 'MOTH → GLIDER', 'green'],
  [115.30, 'BEETLE loops forever!', 'red'], [115.6, 'PAINT + SHIP · BREAK'], [116.51, 'break;  BEETLE → WHEEL', 'green'],
  [116.88, 'LADYBUG flashes ERROR!', 'red'], [117.05, 'CATERPILLAR overflows!', 'red'], [117.23, 'GUARD! Nobody flinches.'],
  [117.65, 'PAINT + RUN + SHIP'], [118.38, 'LADYBUG · CATERPILLAR ♥ MAX'], [118.469, 'CATERPILLAR → BRIDGE', 'green'],
  [118.659, 'LADYBUG → BUTTON', 'green'], [119.02, 'Every bug is a feature now.', 'green'],
  [143.36, ''], [143.48, 'THE ERASER looms over the page.', 'red'], [147.358, "You can't draw without erasing."],
  [147.793, 'GLIDER lifts JADE up!'], [148.191, 'PAINT: pink, like her pencil cap'], [148.59, 'RUN: RICKY plays the color'],
  [148.989, 'SHIP: CHARLIE gives it a hat'], [149.22, 'THE ERASER joined the party! Class: UNDO', 'gold'],
];
/** (r5) act4_r5's `> you` is ENTERed on 147.693 (y/o/u on the 16ths from 147.394): the ENTER line and the first ♥ move with it */
const ACTION_R5 = ACTION.map((e) => (e[0] === 147.358 ? [147.693, e[1], e[2]] : e));
const HEARTS_R5 = HEARTS.map((e) => (e[0] === 147.358 && e[1] === 'eraser' ? [147.693, 'eraser', 1] : e));
const actionList = () => (R5() ? ACTION_R5 : ACTION);
const heartList = () => (R5() ? HEARTS_R5 : HEARTS);
/** lyric lines the message window carries (crawl from word times; held until the next line or end + LYRIC_HOLD) */
export const LYRIC_LINES = [27, 28, 30, 32, 33, 39, 40];
const LYRIC_HOLD = 1.5;
/** command windows. cursor: [t, item]; skills: the nested syntax cascade; field: the > prompt */
export const CMDS = [
  { t0: 110.41, t1: 111.86, who: 'jade', cursor: [[110.41, 'FIGHT'], [110.52, 'PAINT']],
    skills: { t0: 110.45, step: 1 / 30, items: ['SKILLS ▸', 'for(;;)', '{ }', ';', '语法'],
      // topple on 不用背语法: the top window falls first, one per syllable (用 背 语 法), SKILLS last
      topple: [111.195, 111.195, 110.974, 110.803, 110.643] },
    field: { open: 111.24, text: "let's dance", type: [111.36, 111.66], enter: 111.705, close: 111.86 } },
  { t0: 117.3, t1: 117.95, who: 'all', cursor: [[117.3, 'FIGHT'], [117.42, 'PAINT'], [117.5, 'RUN'], [117.57, 'SHIP'], [117.65, 'TECH']] },
  // the last menu: FIGHT struck, cursor to PAINT, then the menu gives way to the text field (she types instead of picking)
  { t0: 143.48, t1: 144.0, who: 'jade', cursor: [[143.48, 'FIGHT'], [143.75, 'PAINT']],
    field: { open: 144.0, text: 'an eraser', enter: 147.358, close: 147.6,
      // typed on the syllables of "ask myself what it is that I need": pencils as drumsticks
      keys: [144.271, 144.446, 144.62, 145.354, 145.577, 145.787, 146.556, 146.89, 147.218] } },
];
/** (r5) round-5 command windows (docs/game_design_half2_r5.md): Jade's syntax turn keeps the nested-menu gag but shorter (two
 *  cascades, then the text field); the final boss: FIGHT struck + `not very effective`, the cursor holds on FIGHT until 147.0,
 *  NO 2D text field (act4 draws `> you` in the world between Jade and the Eraser), only the message line stays. */
export const CMDS_R5 = [
  { ...CMDS[0], skills: { t0: 110.45, step: 1 / 30, items: ['SKILLS ▸', 'for(;;)', '语法'], topple: [111.195, 110.974, 110.803] } },
  CMDS[1],
  { t0: 143.48, t1: 144.0, who: 'jade', cursor: [[143.48, 'FIGHT'], [143.75, 'PAINT']] },   // no field: act4_r5 draws `> you` in the world
];
const cmdList = () => (R5() ? CMDS_R5 : CMDS);
export const BANNERS = [
  { t0: 117.65, t1: 118.95, kind: 'tech' },      // TRIPLE TECH · 一笔一画
  { t0: 119.02, t1: 120.75, kind: 'victory' },   // ★ VICTORY ★
];
/** flowers burst out of the message window frame on 开 (114.998) and spill onto the stage */
export const FLOWERS = { t0: 114.998, n: 26, dur: 1.4 };
/** the boss glitch: the party window corrupts into garbage glyphs */
export const CORRUPT = [116.88, 117.23];

// =================================================================== look (from out/mocks/half2/_work/ui.py)
export const LW = 384, LH = 216, BAND_Y = 159, BAND_B = LH - 3, STRIP_Y = 141;
const NAVY0 = '#0d1022', NAVY1 = '#161b38', NAVY2 = '#222a52', SLATE_HI = '#5a6080';
const GOLD = '#f5c542', GOLD_HI = '#ffe58a', WHITE = '#ffffff', GREEN = '#4fd06a', RED = '#ff4d6d', SUBC = '#c8cce0', LIME = '#b6e84a', PINK = '#ff6b8a';
const RAINBOW = ['#ff4d6d', '#ff7a3d', '#ffb02e', '#ffe14d', '#b6e84a', '#4fd06a', '#2ec4a6', '#2bb4e8', '#3b7bff', '#6a5cff', '#a35cff', '#e858d0'];
const CLASS_COL = { SHIP: '#cdae74', RUN: '#7fc4ff', UNDO: '#ff9ec0' };
const ACT_COL = { red: '#ff8a9a', green: LIME, gold: GOLD_HI };
const HEROES = [['jade', 'JADE', 'PAINT'], ['charlie', 'CHARLIE', 'SHIP'], ['ricky', 'RICKY', 'RUN']];
const CMD_ITEMS = ['FIGHT', 'PAINT', 'RUN', 'SHIP', 'TECH'];
/** preview-only anchor fallbacks (normalized screen, top-left origin), roughly where the mocks put things */
export const DEFAULT_ANCHORS = {
  ladybug: [0.14, 0.42], beetle: [0.25, 0.38], moth: [0.36, 0.30], caterpillar: [0.45, 0.44], firefly: [0.52, 0.28],
  jade: [0.56, 0.40], charlie: [0.65, 0.38], ricky: [0.74, 0.40], eraser: [0.5, 0.22],
};

// =================================================================== pure state
const on = (t, e) => T.on(t, e);
const since = (t, e) => T.since(t, e);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const easeOut = (u) => 1 - Math.pow(1 - clamp01(u), 3);
const easeIn = (u) => Math.pow(clamp01(u), 3);
function hash(a, b = 0) { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); }
function lastAt(t, list) { let v = null; for (const e of list) if (on(t, e[0])) v = e; return v; }

/** (v4) the battle UI no longer carries the lyrics: the one subtitle style (SmoothSubs) does. Set globalThis.BATTLE_UI_V3 = true
 *  to get the v3 JRPG layer back (message window = subtitle, party / enemy windows, VICTORY, recruit, ...). */
export const UI_V4 = () => globalThis.BATTLE_UI_V3 !== true;
export function battleOwnsSubs(t) { if (UI_V4()) return false; return BATTLE.ownsSubs.some(([a, b]) => t >= a && t < b); }

/** phase + layout rects (x0, x1 inclusive, canvas px, y down) */
function phaseAt(t) {
  const F = BATTLE.final;
  if (t >= BATTLE.enc && t < Math.min(BATTLE.close + BATTLE.closeDur + 0.05, BATTLE.near.t0)) {
    if (t < BATTLE.victory) return { phase: 'battle', left: [3, 100], msg: [103, 252], party: [255, 381], strip: false };
    if (t < BATTLE.recruit.t0) return { phase: 'victory', left: null, msg: [3, 222], party: [225, 381], strip: false };
    return { phase: 'recruit', left: null, msg: [3, 222], party: [225, 381], strip: true };
  }
  if (t >= BATTLE.near.t0 && t < BATTLE.near.t1) return { phase: 'near' };
  if (t >= F.open && t < F.close + BATTLE.closeDur + 0.05) { const c = !!cmdAt(t);
    // (r5, act4_r5 REQUEST 3) the party window collapses to nothing for the last fight; it pops back for the 8 -> 9 moment
    // (149.22-150.6), then collapses again; without it the message window is the slim lyric strip (drawSlimFinal)
    if (R5() && (!on(t, F.join) || t >= 150.6)) return { phase: 'final', left: c ? [3, 100] : null, msg: c ? [103, 381] : [3, 381], party: null, strip: true, slimMsg: !c };
    return { phase: 'final', left: c ? [3, 100] : null, msg: c ? [103, 222] : [3, 222], party: [225, 381], strip: true }; }
  return { phase: 'off' };
}
function slideAt(t, ph) {
  if (ph.phase === 'final') { const F = BATTLE.final; return easeOut(since(t, F.open) / BATTLE.openDur) * (1 - easeIn(since(t, F.close) / BATTLE.closeDur)); }
  return easeOut(since(t, BATTLE.open) / BATTLE.openDur) * (1 - easeIn(since(t, BATTLE.close) / BATTLE.closeDur));
}
export function heartsAt(t, id) { let n = 0; for (const [e, who, k] of heartList()) if (who === id && on(t, e)) n += k; return Math.min(BATTLE.hearts, n); }
export function convertedAt(t, id) { return CONVERT.some(([e, who]) => who === id && on(t, e)); }
export function activeAt(t) { return lastAt(t, ACTIVE)?.[1] || []; }
/** party roster at t: ids in order (3 heroes, + features one per 8th, + the eraser) */
export function partyAt(t) {
  const out = ['jade', 'charlie', 'ricky'];
  const R = BATTLE.recruit;
  if (t >= 140) out.push(...R.order); else R.joins.forEach((e, i) => { if (on(t, e)) out.push(R.order[i]); });
  if (t >= 140 && on(t, BATTLE.final.join)) out.push('eraser');
  return out;
}
function cmdAt(t) { return cmdList().find((c) => t >= T.snap(c.t0) - 1e-6 && t < T.snap(c.t1)) || null; }
function bannerAt(t) { return BANNERS.find((b) => on(t, b.t0) && !on(t, b.t1)) || null; }
function lyricAt(t) {
  let cur = null;
  for (const id of LYRIC_LINES) { const L = T.line(id); if (!L) continue; if (t >= L.start - 0.05) cur = L; }
  if (!cur) return null;
  const next = LYRIC_LINES.map((id) => T.line(id)).find((L) => L && L.start > cur.start);
  if (t > cur.end + LYRIC_HOLD && !(next && t >= next.start - 0.05)) return null;
  return cur;
}
/** typewriter: characters of SUBS[id].top revealed at t (one char per syllable/letter, timed to the word) */
export function crawlCount(t, id) {
  const S = SUBS[id], L = T.line(id); if (!S || !L) return 0;
  const ws = L.words || []; const chars = Array.from(S.top);
  const wEnd = (i) => (ws[i + 1] ? ws[i + 1].start : L.end);
  let n = 0;
  if (S.sung === 'zh') {
    let wi = 0, used = 0;
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === ' ' || ch === '，') { if (n === i) n = i + 1; continue; }
      const w = ws[Math.min(wi, ws.length - 1)]; const k = w ? Array.from(w.w).length : 1;
      const dur = Math.min(0.24, Math.max(0.03, (w ? wEnd(Math.min(wi, ws.length - 1)) - w.start : 0.1) * 0.8));
      const te = w ? w.start + (used / k) * dur : 1e9;
      if (on(t, te)) n = i + 1; else break;
      used++; if (used >= k) { wi++; used = 0; }
    }
  } else {
    const toks = S.top.split(' '); let pos = 0;
    for (let i = 0; i < toks.length; i++) {
      const w = ws[Math.min(i, ws.length - 1)]; const tok = toks[i];
      const dur = Math.min(0.035 * tok.length, Math.max(0.03, (w ? wEnd(Math.min(i, ws.length - 1)) - w.start : 0.1) * 0.85));
      for (let j = 0; j < tok.length; j++) { if (w && on(t, w.start + (j / tok.length) * dur)) n = pos + j + 1; }
      pos += tok.length + 1; if (w && on(t, w.start + dur)) n = Math.min(chars.length, pos);
    }
  }
  return n;
}

/** Semantic battle state at t (scenes may read it to sync: who is active, ♥ per bug, converted, roster, ...) */
export function battleAt(t) {
  const ph = phaseAt(t);
  const ids = [...BATTLE.enemies.map((e) => e.id), 'eraser'];
  const hearts = Object.fromEntries(ids.map((id) => [id, heartsAt(t, id)]));
  return {
    visible: ph.phase !== 'off', phase: ph.phase, slide: ph.phase === 'off' || ph.phase === 'near' ? 0 : slideAt(t, ph),
    swirl: swirlFrame(t), ownsSubs: battleOwnsSubs(t),
    hearts, full: Object.fromEntries(ids.map((id) => [id, hearts[id] >= BATTLE.hearts])),
    converted: Object.fromEntries(BATTLE.enemies.map((e) => [e.id, convertedAt(t, e.id)])),
    active: activeAt(t), party: partyAt(t), cmd: cmdAt(t), banner: bannerAt(t)?.kind || null,
    corrupt: t >= CORRUPT[0] && t < CORRUPT[1], action: lastAt(t, actionList())?.[1] || '', lyric: lyricAt(t)?.id ?? null,
  };
}
/** 0..3 during the 107.15 battle transition, else -1 */
export function swirlFrame(t) { const k = Math.round(t * T.fps()) - T.frameOf(BATTLE.enc); return k >= 0 && k < BATTLE.swirlFrames ? k : -1; }

/** floating tags alive at t: { kind: 'heart'|'miss'|'guard'|'feature', text, target, age, life } */
export function battleTagsAt(t) {
  const out = []; const push = (e, kind, text, target, life) => { const age = since(t, e); if (age >= 0 && age < life) out.push({ kind, text, target, age, life, t0: e }); };
  for (const [e, id, k] of heartList()) push(e, 'heart', '♥+' + k, id, 0.75);
  for (const [e, kind, id] of TAGS) push(e, kind, kind === 'miss' ? 'MISS' : 'GUARD', id, 0.75);
  for (const [e, id] of CONVERT) push(e, 'feature', 'BUG → FEATURE', id, 1.1);
  return out;
}

// =================================================================== drawing (one 384x216 canvas)
const RC = new Map();
function R(spec) {
  const k = JSON.stringify(spec); let r = RC.get(k);
  if (!r) { if (RC.size > 4000) RC.clear(); r = raster(JSON.parse(k)); RC.set(k, r); }
  return r;
}
const SH = { dx: 1, dy: -1, color: NAVY0 };
function txt(g, x, y, text, font = 'fp10', color = WHITE, o = {}) {
  const r = R({ text, font, color, shadow: o.shadow === false ? undefined : SH, ...(o.spec || {}) });
  g.drawImage(r.canvas, Math.round(x), Math.round(y)); return r.w - 1;
}
function spans(g, x, y, sp, font, o = {}) { const r = R({ spans: sp, font, shadow: SH, ...o }); g.drawImage(r.canvas, Math.round(x), Math.round(y)); return r; }
const rainbow = (s, k = 3) => Array.from(s).map((ch, i) => ({ text: ch, color: RAINBOW[(i * k) % 12] }));
function fill(g, x0, y0, x1, y1, c) { g.fillStyle = c; g.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1); }
function outline(g, x0, y0, x1, y1, c) { fill(g, x0, y0, x1, y0, c); fill(g, x0, y1, x1, y1, c); fill(g, x0, y0, x0, y1, c); fill(g, x1, y0, x1, y1, c); }
/** DQ/FF window (mock window(): navy fill, navy0 edge, white border, slate inner line) */
function win(g, x0, y0, x1, y1, { border = WHITE, bg = NAVY1, alpha = 0.92 } = {}) {
  g.globalAlpha = alpha; fill(g, x0, y0, x1, y1, bg); g.globalAlpha = 1;
  outline(g, x0, y0, x1, y1, NAVY0); outline(g, x0 + 1, y0 + 1, x1 - 1, y1 - 1, border); outline(g, x0 + 2, y0 + 2, x1 - 2, y1 - 2, SLATE_HI);
}
const HEART = ['01010', '11111', '11111', '01110', '00100'];
function heart(g, x, y, c) { g.fillStyle = c; HEART.forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === '1') g.fillRect(x + i, y + j, 1, 1); }); }
function hearts(g, x, y, n, full, flashK = -1) {
  for (let k = 0; k < BATTLE.hearts; k++) heart(g, x + k * 6, y, k === flashK ? WHITE : k < n ? (full ? GOLD : PINK) : '#7a7f95');
}

/** area-average resize of a sprite frame into a size x size cell (alpha binarised): portraits and feature icons */
function fitSprite(img, sx, sy, sw, sh, size) {
  const src = document.createElement('canvas'); src.width = sw; src.height = sh;
  const sg = src.getContext('2d', { willReadFrequently: true }); sg.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  const d = sg.getImageData(0, 0, sw, sh).data;
  // trim to the alpha bbox
  let bx0 = sw, by0 = sh, bx1 = -1, by1 = -1;
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) if (d[(y * sw + x) * 4 + 3] > 40) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
  if (bx1 < 0) { bx0 = 0; by0 = 0; bx1 = sw - 1; by1 = sh - 1; }
  const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1, k = Math.min(size / bw, size / bh, 1);
  const ow = Math.max(1, Math.round(bw * k)), oh = Math.max(1, Math.round(bh * k));
  const out = document.createElement('canvas'); out.width = ow; out.height = oh;
  const og = out.getContext('2d'); const im = og.createImageData(ow, oh);
  for (let oy = 0; oy < oh; oy++) for (let ox = 0; ox < ow; ox++) {
    const x0 = bx0 + ox / k, x1 = bx0 + (ox + 1) / k, y0 = by0 + oy / k, y1 = by0 + (oy + 1) / k;
    let r = 0, gg = 0, b = 0, a = 0, w = 0;
    for (let y = Math.floor(y0); y < Math.ceil(y1); y++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
      const i = (y * sw + x) * 4, al = d[i + 3] / 255; r += d[i] * al; gg += d[i + 1] * al; b += d[i + 2] * al; a += al; w++;
    }
    const o = (oy * ow + ox) * 4;
    if (a / w >= 0.45) { im.data[o] = r / a; im.data[o + 1] = gg / a; im.data[o + 2] = b / a; im.data[o + 3] = 255; }
  }
  og.putImageData(im, 0, 0); return out;
}

// ---- swirl (the old 2D game cutting in): copies the frame, pixelates to the half-1 grid and swirls it
const SWIRL_FS = /* glsl */`
  uniform sampler2D tFb; uniform float uK; uniform vec2 uRes; varying vec2 vUv;
  void main(){
    float grid = 320.0 / pow(2.0, uK);                       // 320 -> 160 -> 80 -> 40 columns
    vec2 cells = vec2(grid, grid * 9.0 / 16.0);
    vec2 q = (floor(vUv * cells) + 0.5) / cells;
    vec2 p = (q - 0.5) * vec2(16.0 / 9.0, 1.0);
    float r = length(p); float a = (0.55 + 1.6 * uK * uK) * (1.0 - smoothstep(0.0, 1.1, r));
    float zoom = 1.0 - 0.08 * uK;
    p = mat2(cos(a), -sin(a), sin(a), cos(a)) * p * zoom;
    vec2 uv = p / vec2(16.0 / 9.0, 1.0) + 0.5;
    vec3 c = texture2D(tFb, clamp(uv, 0.001, 0.999)).rgb;
    c = floor(c * 6.0 + 0.5) / 6.0;                           // posterise: the cartridge palette feel
    vec2 f = fract(vUv * cells);                              // the pixel grid lines
    if (f.x < 0.06 || f.y < 0.06) c *= 0.55;
    gl_FragColor = vec4(c, 1.0);
  }`;

// =================================================================== the widget
export async function makeBattleUI(ctx, { fallbackAnchors = false } = {}) {
  await loadFonts(['fp12', 'fp10', 'fp8']);
  const lib = ctx.lib;
  const need = ['portrait_jade', 'portrait_charlie', 'portrait_ricky', 'eraser_redeemed', ...BATTLE.enemies.map((e) => e.fsprite)];
  if (lib.has('portrait_jade_hairdown')) need.push('portrait_jade_hairdown');
  await lib.preload(need.filter((n) => lib.has(n)));
  // ---- portraits (16 px, half-1 HUD art; Jade hair DOWN: she holds the pencils all second half)
  const P = {};
  const fr0 = (name) => { const s = lib.get(name); return [s.img, 0, 0, s.w, s.h]; };
  const jadeSrc = lib.has('portrait_jade_hairdown') ? fr0('portrait_jade_hairdown') : [jadePortraitHairDown(lib), 0, 0, 32, 32];
  P.jade = fitSprite(...jadeSrc, 16); P.charlie = fitSprite(...fr0('portrait_charlie'), 16); P.ricky = fitSprite(...fr0('portrait_ricky'), 16);
  for (const e of BATTLE.enemies) P[e.id] = lib.has(e.fsprite) ? fitSprite(...fr0(e.fsprite), 16) : null;
  P.eraser = lib.has('eraser_redeemed') ? fitSprite(...fr0('eraser_redeemed'), 16) : null;
  const flowers = Array.from({ length: 8 }, (_, i) => flowerCanvas(i, 3));

  // ---- canvas -> one nearest-filtered quad in a 384x216 ortho scene
  const cv = document.createElement('canvas'); cv.width = LW; cv.height = LH;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); const cam = new THREE.OrthographicCamera(0, LW, LH, 0, -10, 10);
  const quad = new Quad(tex, LW, LH); quad.place(0, 0); quad.renderOrder = 10; scene.add(quad);
  // swirl plane (drawn first; copies the framebuffer in onBeforeRender)
  let fbTex = null;
  const swMat = new THREE.ShaderMaterial({ uniforms: { tFb: { value: null }, uK: { value: 0 }, uRes: { value: new THREE.Vector2(ctx.width, ctx.height) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: SWIRL_FS, depthTest: false, depthWrite: false });
  const swirl = new THREE.Mesh(new THREE.PlaneGeometry(LW, LH), swMat); swirl.position.set(LW / 2, LH / 2, 0); swirl.renderOrder = 0; swirl.frustumCulled = false;
  swirl.onBeforeRender = (renderer) => {
    const rt = renderer.getRenderTarget(); const v = new THREE.Vector2();
    if (rt) v.set(rt.width, rt.height); else renderer.getDrawingBufferSize(v);
    if (!fbTex || fbTex.image.width !== v.x || fbTex.image.height !== v.y) { fbTex?.dispose(); fbTex = new THREE.FramebufferTexture(v.x, v.y); fbTex.colorSpace = THREE.NoColorSpace; }
    renderer.copyFramebufferToTexture(fbTex); swMat.uniforms.tFb.value = fbTex;
  };
  scene.add(swirl);

  let anchors = {}, camera = null, nameTags = false, slim = false, slimTags = false;
  /** anchor of a target id -> canvas px [x, y] (or null) */
  function anchorPx(id) {
    let a = anchors[id];
    if (a && a.isVector3) a = camera ? project(a, camera) : null;
    if (!a && fallbackAnchors) a = DEFAULT_ANCHORS[id];
    return a ? [a[0] * LW, a[1] * LH] : null;
  }

  // ------------------------------------------------------------ pieces
  function drawEnemies(t, x0, x1, y0) {
    win(g, x0, y0, x1, BAND_B);
    const list = phaseAt(t).phase === 'final' ? [{ id: 'eraser', name: 'THE ERASER' }] : BATTLE.enemies;
    list.forEach((e, i) => {
      const tin = phaseAt(t).phase === 'final' ? BATTLE.final.enemyIn : BATTLE.enemiesIn + i * E8;
      if (!on(t, tin)) return;
      const y = y0 + 4 + i * 9.6, n = heartsAt(t, e.id), full = n >= BATTLE.hearts, conv = e.feature && convertedAt(t, e.id);
      const pop = since(t, tin) < 0.07;
      const name = conv ? e.feature : e.name;
      const flick = conv && since(t, CONVERT.find((c) => c[1] === e.id)[0]) < 0.2 && Math.round(t * 30) % 2 === 0;
      txt(g, x0 + 5, y, flick ? e.name : name, 'fp8', pop ? WHITE : full ? GOLD : WHITE);
      // newest heart flashes white for 2 frames
      let flashK = -1; for (const [te, who] of heartList()) if (who === e.id && since(t, te) >= 0 && since(t, te) < 0.07) flashK = n - 1;
      hearts(g, x1 - 34, Math.round(y) + 2, n, full, flashK);
    });
  }
  function drawCmd(t, c, x0, x1, y0) {
    win(g, x0, y0, x1, BAND_B);
    const cur = lastAt(t, c.cursor)?.[1];
    const rows = [['FIGHT', 2], ['nve', 9.5], ['PAINT', 18], ['RUN', 26.5], ['SHIP', 35], ['TECH', 43.5]];
    for (const [it, dy] of rows) {
      const y = y0 + dy;
      if (it === 'nve') { const blink = cur === 'FIGHT' && Math.floor(t * 8) % 2 === 0; txt(g, x0 + 14, y - 1, 'not very effective', 'fp8', blink ? '#ff8a9a' : '#9a7a86', { shadow: false }); continue; }
      if (it === 'FIGHT') { const w = txt(g, x0 + 12, y, 'FIGHT', 'fp8', '#6b6b72'); fill(g, x0 + 11, Math.round(y) + 4, x0 + 12 + w, Math.round(y) + 4, RED); }
      else txt(g, x0 + 12, y, it, 'fp8', cur === it ? GOLD_HI : WHITE);
      if (cur === it) txt(g, x0 + 4, y, '▶', 'fp8', GOLD);
    }
  }
  function drawSkills(t, c) {
    const S = c.skills; if (!S) return;
    S.items.forEach((label, i) => {
      const tin = S.t0 + i * S.step; if (!on(t, tin)) return;
      const r = R({ text: label, font: 'fp8', color: label.startsWith('SKILLS') ? GOLD_HI : WHITE, shadow: SH });
      const w = r.w + 9, h = 15;
      let x = 30; for (let j = 0; j < i; j++) x += R({ text: S.items[j], font: 'fp8', color: WHITE, shadow: SH }).w + 9 - 5;
      const y = STRIP_Y + 3 - i;
      const tf = S.topple[i]; const u = since(t, tf);
      const wobble = u < 0 ? Math.sin((t - tin) * 40 + i) * 0.04 * (since(t, tin) > 0.15 ? 1 : 0) : 0;
      const ang = u > 0 ? (i % 2 ? -1 : 1) * Math.min(2.2, 4.5 * u * u + 1.2 * u) : wobble;
      const fall = u > 0 ? 260 * u * u : 0;
      if (y + fall > LH + 40) return;
      g.save(); const px = x + (ang >= 0 ? w : 0), py = y + h; g.translate(px, py + fall); g.rotate(ang);
      g.translate(-px, -py); win(g, x, y, x + w, y + h, { bg: NAVY2 }); g.drawImage(r.canvas, x + 5, y + 4); g.restore();
    });
  }
  function drawField(t, c) {
    const F = c.field; if (!F || !on(t, F.open) || on(t, F.close)) return;
    const x0 = 3, x1 = 150, y0 = STRIP_Y - 1, y1 = BAND_Y - 2;
    const enter = since(t, F.enter); const hit = enter >= 0 && enter < 0.12;
    win(g, x0, y0, x1, y1, { border: hit ? GOLD_HI : WHITE, bg: hit ? NAVY2 : NAVY0, alpha: 0.95 });
    let n = 0;
    if (F.keys) n = F.keys.filter((e) => on(t, e)).length;
    else n = Math.floor(F.text.length * clamp01((t - F.type[0]) / (F.type[1] - F.type[0])) + 1e-6) + (on(t, F.type[1]) ? 0 : 0);
    if (on(t, F.enter)) n = F.text.length;
    const shown = '> ' + F.text.slice(0, n);
    const fc = t < 119.02 ? '#f2f2f4' : '#58f08a';   // (v4b H13) `> let's dance` in white before the flood (graphite chrome)
    const w = txt(g, x0 + 6, y0 + 3, shown, 'fp12', fc);
    if (!on(t, F.enter) && (Math.floor(t * 4) % 2 === 0 || n < F.text.length)) fill(g, x0 + 7 + w, y0 + 5, x0 + 11 + w, y0 + 13, fc);
    // ENTER key cap
    const kx1 = x1 - 5, kw = R({ text: 'ENTER ↵', font: 'fp8', color: WHITE }).w + 6, kx0 = kx1 - kw;
    fill(g, kx0, y0 + 4, kx1, y1 - 4, hit ? GOLD_HI : NAVY2); outline(g, kx0, y0 + 4, kx1, y1 - 4, hit ? WHITE : SLATE_HI);
    txt(g, kx0 + 3, y0 + 6, 'ENTER ↵', 'fp8', hit ? NAVY0 : '#9aa0c0', { shadow: false });
  }
  function msgLayout(W, lyr, tr, act, firstFont = 'fp12') {
    const cands = firstFont === 'fp12' ? [['fp12', 'fp10'], ['fp10', 'fp10'], ['fp10', 'fp8'], ['fp8', 'fp8']] : [['fp10', 'fp8'], ['fp8', 'fp8']];
    const room = BAND_B - BAND_Y - 8;
    const actH = act ? R({ text: act, font: 'fp8', maxWidth: W }).h : 0;
    for (const [a, b] of cands) {
      const hL = lyr ? R({ ...lyr, font: a, maxWidth: W, shadow: SH, reveal: undefined }).h : 0;
      const hT = tr ? R({ text: tr, font: b, maxWidth: W, shadow: SH }).h : 0;
      if (hL + hT + actH + (tr ? 2 : 0) + (act ? 1 : 0) <= room) return [a, b];
    }
    return cands[cands.length - 1];
  }
  function drawMsg(t, x0, x1, y0, ph) {
    win(g, x0, y0, x1, BAND_B);
    const actE = lastAt(t, actionList()); let act = actE?.[1] || '';
    const actN = actE ? Math.floor(clamp01(since(t, actE[0]) * 75 / Math.max(1, act.length)) * act.length + 1e-6) : 0;
    let W = x1 - x0 - 13, lyr = null, tr = null, lyrRev, trRev, first = 'fp12';
    if (ph.phase === 'recruit') {
      W -= 46; first = 'fp10';
      lyr = { text: 'The BUGS look at you longingly.\nLet them join your party?', color: WHITE };
      tr = '虫子们深情地望着你。要让它们加入队伍吗？';
      const u = since(t, BATTLE.recruit.t0); lyrRev = Math.floor(u * 95); trRev = Math.floor(u * 50); act = '';
    } else {
      const L = lyricAt(t);
      if (L) {
        const S = SUBS[L.id]; const n = crawlCount(t, L.id);
        // "Bug" types in red (the enemy's word)
        lyr = S.top.startsWith('Bug') ? { spans: [{ text: 'Bug', color: RED }, { text: S.top.slice(3), color: WHITE }] } : { text: S.top, color: WHITE };
        lyrRev = n; tr = S.bot; trRev = Math.floor(clamp01(since(t, L.start + 0.05) * 60 / Math.max(1, Array.from(tr).length)) * Array.from(tr).length + 1e-6);
      }
    }
    const [fa, fb] = msgLayout(W, lyr, tr, act, first);
    let y = y0 + 4;
    if (lyr) { const r = R({ ...lyr, font: fa, maxWidth: W, shadow: SH, reveal: lyrRev }); g.drawImage(r.canvas, x0 + 7, y); y += r.h + 2; }
    if (tr) { const r = R({ text: tr, font: fb, color: SUBC, maxWidth: W, shadow: SH, reveal: trRev }); g.drawImage(r.canvas, x0 + 7, y); }
    if (act) {
      const col = ACT_COL[actE[2]] || GOLD_HI;
      const r = R({ text: act, font: 'fp8', color: col, maxWidth: W, shadow: SH, reveal: actN });
      g.drawImage(r.canvas, x0 + 7, BAND_B - 3 - r.h);
    }
    if (ph.phase === 'recruit') {   // DQ choice popup (mock m3); Charlie's button press = YES
      const bx0 = x1 - 46, bx1 = x1 - 4, by0 = y0 + 4, by1 = y0 + 32;
      const yes = since(t, BATTLE.recruit.yes); const press = yes >= 0 && yes < 0.14;
      win(g, bx0, by0, bx1, by1, { bg: NAVY2 });
      if (press) fill(g, bx0 + 3, by0 + 3, bx1 - 3, by0 + 15, GOLD_HI);
      if (!(yes >= 0.14 && yes < 0.5 && Math.floor(t * 10) % 2)) txt(g, bx0 + 4, by0 + 3, '▶', 'fp10', press ? NAVY0 : GOLD);
      txt(g, bx0 + 14, by0 + 3, 'YES', 'fp10', press ? NAVY0 : GOLD_HI, { shadow: !press }); txt(g, bx0 + 14, by0 + 15, 'NO', 'fp10', WHITE);
    }
  }
  function garble(t, k, n) { const G = '#%&@$?!¥§¶ΞЖ░▒▓█<>{}'; let s = ''; for (let i = 0; i < n; i++) s += G[Math.floor(hash(Math.round(t * 30) + k * 7, i) * G.length)]; return s; }
  function drawPartyRows(t, x0, x1, y0) {
    const cor = t >= CORRUPT[0] && t < CORRUPT[1];
    win(g, x0 + (cor ? Math.round((hash(Math.round(t * 30), 9) - 0.5) * 4) : 0), y0, x1, BAND_B, { border: cor ? (Math.round(t * 30) % 2 ? RED : '#e858d0') : WHITE });
    const act = activeAt(t);
    HEROES.forEach(([id, nm, cl], i) => {
      if (!on(t, BATTLE.intro[id]) && t < 140) return;
      const jx = cor ? Math.round((hash(Math.round(t * 30), i) - 0.5) * 6) : 0;
      const y = y0 + 3 + i * 17, px = x0 + 5 + jx;
      const lit = act.includes(id); const pop = since(t, BATTLE.intro[id]) < 0.1 && t < 140;
      const flash = ACTS.some(([e, who]) => who === id && since(t, e) >= 0 && since(t, e) < 0.12);
      fill(g, px - 1, y - 1, px + 16, y + 16, NAVY0);
      if (cor && hash(Math.round(t * 30), i + 3) > 0.4) { for (let q = 0; q < 16; q += 4) for (let r = 0; r < 16; r += 4) fill(g, px + q, y + r, px + q + 3, y + r + 3, ((q + r) / 4) % 2 ? '#ff00ff' : '#000000'); }
      else g.drawImage(P[id], px + Math.floor((16 - P[id].width) / 2), y + Math.floor((16 - P[id].height) / 2));
      outline(g, px - 1, y - 1, px + 16, y + 16, flash || pop ? WHITE : lit ? GOLD : SLATE_HI);
      if (lit) outline(g, px - 2, y - 2, px + 17, y + 17, flash ? WHITE : GOLD);
      const name = cor ? garble(t, i, nm.length) : nm;
      txt(g, x0 + 25 + jx, y + 2, name, 'fp10', cor ? RED : lit ? GOLD_HI : WHITE);
      const cx = x0 + 68 + jx;
      if (cor) txt(g, cx, y + 3, garble(t, i + 5, cl.length), 'fp8', '#e858d0');
      else if (cl === 'PAINT') spans(g, cx, y + 3, rainbow(cl), 'fp8'); else txt(g, cx, y + 3, cl, 'fp8', CLASS_COL[cl]);
      const bx = x0 + 98 + jx; fill(g, bx, y + 6, x1 - 7, y + 10, cor ? (Math.round(t * 30) % 2 ? RED : '#3a1020') : GREEN); outline(g, bx, y + 6, x1 - 7, y + 10, NAVY0);
    });
  }
  function drawPartyStrip(t, x0, x1, y0) {
    win(g, x0, y0, x1, BAND_B);
    const party = partyAt(t); const n = party.length; const from = t > 140 ? 8 : 3;
    let x = x0 + 6; x += txt(g, x, y0 + 4, n > from ? `PARTY  ${from} → ` : `PARTY  ${from}`, 'fp10', WHITE);
    if (n > from) txt(g, x + 4, y0 + 4, String(n), 'fp10', GOLD_HI);
    const step = Math.min(18, Math.floor((x1 - x0 - 10) / Math.max(8, n)));
    party.forEach((id, i) => {
      const px = x0 + 6 + i * step, py = y0 + 20; const isNew = i >= 3;
      const joinT = id === 'eraser' ? BATTLE.final.join : t < 140 ? BATTLE.recruit.joins[BATTLE.recruit.order.indexOf(id)] : -1;
      const pop = joinT > 0 && since(t, joinT) < 0.1;
      fill(g, px - 1, py - 1, px + 16, py + 16, pop ? WHITE : NAVY0);
      const sp = P[id]; if (sp && !pop) g.drawImage(sp, px + Math.floor((16 - sp.width) / 2), py + Math.floor((16 - sp.height) / 2));
      outline(g, px - 1, py - 1, px + 16, py + 16, id === 'eraser' ? '#ff9ec0' : isNew ? GOLD : SLATE_HI);
    });
    if (t < 140 && on(t, BATTLE.recruit.joins[4])) txt(g, x0 + 6, y0 + 41, '+5 FEATURES joined', 'fp8', LIME);
    if (t > 140 && on(t, BATTLE.final.join)) { let xx = x0 + 6; xx += txt(g, xx, y0 + 41, 'THE ERASER · ', 'fp8', WHITE); txt(g, xx, y0 + 41, 'UNDO', 'fp8', CLASS_COL.UNDO); }
  }
  function drawBanner(t, b, msg) {
    const u = since(t, b.t0);
    if (b.kind === 'tech') {
      const r1 = R({ text: 'TRIPLE TECH · ', font: 'fp10', color: GOLD_HI, shadow: SH }), r2 = R({ spans: rainbow('一笔一画'), font: 'fp10', shadow: SH });
      const bw = r1.w + r2.w + 14, cx = (msg[0] + msg[1]) / 2; const pop = u < 0.07 ? 1 : 0;
      const bx = Math.round(cx - bw / 2) - pop * 3;
      win(g, bx, STRIP_Y - pop, bx + bw + pop * 6, BAND_Y - 3 + pop, { border: u < 0.07 ? WHITE : GOLD, bg: NAVY2, alpha: 0.96 });
      g.drawImage(r1.canvas, bx + 7 + pop * 3, STRIP_Y + 3); g.drawImage(r2.canvas, bx + 7 + pop * 3 + r1.w - 1, STRIP_Y + 3);
    } else {
      const blink = Math.floor(u * 6) % 2 === 0;
      const r = R({ text: blink ? '★ VICTORY ★' : '☆ VICTORY ☆', font: 'fp10', color: GOLD_HI, shadow: SH });
      const bw = r.w + 14, cx = (msg[0] + msg[1]) / 2, bx = Math.round(cx - bw / 2);
      win(g, bx, STRIP_Y + 1, bx + bw, BAND_Y - 3, { border: GOLD, bg: NAVY2, alpha: 0.96 });
      g.drawImage(r.canvas, bx + 7, STRIP_Y + 3);
    }
  }
  function drawFlowers(t, msg) {
    const u = since(t, FLOWERS.t0); if (u < 0 || u > FLOWERS.dur) return;
    for (let i = 0; i < FLOWERS.n; i++) {
      const side = i % 3; // top edge mostly, some from the side frames
      const x0 = side === 2 ? (i % 2 ? msg[0] : msg[1]) : msg[0] + 6 + hash(i, 1) * (msg[1] - msg[0] - 12);
      const y0 = side === 2 ? BAND_Y + 8 + hash(i, 2) * 30 : BAND_Y;
      const d = u - hash(i, 3) * 0.18; if (d < 0) continue;
      const vx = (hash(i, 4) - 0.5) * 70 + (side === 2 ? (i % 2 ? -40 : 40) : 0), vy = -(70 + 90 * hash(i, 5));
      const x = x0 + vx * d, y = y0 + vy * d + 0.5 * 260 * d * d;
      if (y > LH) continue;
      const f = flowers[i % flowers.length]; g.drawImage(f, Math.round(x) - 5, Math.round(y) - 8, f.width * 2, f.height * 2);
    }
  }
  function drawTags(t, only = null) {
    const tags = battleTagsAt(t);
    for (const tg of tags) {
      if (only && tg.kind !== only) continue;
      // rapid ♥ ticks on one target: only the newest floats (no pile-up)
      if (tg.kind === 'heart' && tags.some((o) => o.kind === 'heart' && o.target === tg.target && o.age < tg.age)) continue;
      const a = anchorPx(tg.target); if (!a) continue;
      if (tg.age > tg.life - 0.15 && Math.round(t * 30) % 2) continue;   // blink out
      const rise = Math.round(12 * easeOut(tg.age / 0.5));
      // stagger tags that share a target within the same 0.3 s
      if (tg.kind === 'feature') {
        const pre = t < 119.02;   // (v4b H13) before the flood the UI chrome is graphite / white (it renders after post: the grade cannot reach it)
        const r1 = R({ text: 'BUG → ', font: 'fp8', color: pre ? '#b9b9c0' : GOLD_HI, shadow: SH }), r2 = R({ text: 'FEATURE', font: 'fp8', color: pre ? '#ffffff' : LIME, shadow: SH });
        const w = r1.w + r2.w + 8; let x = Math.round(a[0] - w / 2), y = Math.round(a[1] - 26 - rise) - 16 * tags.filter((o) => o.kind === 'feature' && o.t0 < tg.t0).length;   // (battle scene v2) stack overlapping tags
        if (only) { x = Math.max(4, Math.min(LW - w - 4, x)); y = Math.max(6, Math.min(STRIP_Y - 16, y)); }   // (r5) the card's tag stays inside the frame (the bug is big in the over-shoulder shots)
        win(g, x, y, x + w, y + 13, { alpha: 0.9 }); g.drawImage(r1.canvas, x + 4, y + 3); g.drawImage(r2.canvas, x + 4 + r1.w - 1, y + 3);
        continue;
      }
      const col = tg.kind === 'heart' ? PINK : tg.kind === 'guard' ? '#7fc4ff' : WHITE;
      const r = R({ text: tg.text, font: tg.kind === 'heart' ? 'fp10' : 'fp8', color: col, outline: NAVY0, outline8: true });
      const off = tg.kind === 'miss' ? Math.round((hash(tg.t0, 1) - 0.5) * 24) : 0;
      g.drawImage(r.canvas, Math.round(a[0] - r.w / 2 + off), Math.round(a[1] - 14 - rise));
    }
  }
  function drawNameTags(t) {   // optional in-world enemy tags (mock style); off unless the scene asks
    for (const e of BATTLE.enemies) {
      const a = anchorPx(e.id); if (!a || !on(t, BATTLE.enemiesIn)) continue;
      const n = heartsAt(t, e.id), full = n >= BATTLE.hearts, nm = convertedAt(t, e.id) ? e.feature : e.name;
      const r = R({ text: nm, font: 'fp8', color: full ? GOLD : WHITE, shadow: SH }); const w = Math.max(r.w, 31) + 8;
      const x = Math.round(a[0] - w / 2), y = Math.round(a[1] - 48);
      win(g, x, y, x + w, y + 20, { alpha: 0.85 }); g.drawImage(r.canvas, x + 4, y + 2); hearts(g, Math.round(a[0] - 14), y + 13, n, full);
    }
  }
  function drawEraserWin(t) {   // the final boss's ♥ meter: one small window in the pop-up strip
    const n = heartsAt(t, 'eraser'), full = n >= BATTLE.hearts;
    // (r5, act4_r5 REQUEST 5) top-right corner, clear of the world text field (frame centre) and of the bottom band
    const x0 = R5() ? LW - 101 : 3, x1 = x0 + 97, y0 = R5() ? 4 : STRIP_Y + 1;
    win(g, x0, y0, x1, y0 + 14);
    txt(g, x0 + 5, y0 + 3, 'THE ERASER', 'fp8', full ? GOLD : WHITE);
    let flashK = -1; for (const [te, who] of heartList()) if (who === 'eraser' && since(t, te) >= 0 && since(t, te) < 0.07) flashK = n - 1;
    hearts(g, x1 - 34, y0 + 5, n, full, flashK);
  }
  function drawNear(t) {
    const N = BATTLE.near; const u = since(t, N.t0); const flash = u < 0.1;
    const r = R({ text: N.text, font: 'fp12', color: WHITE, shadow: { dx: 1, dy: -1, color: '#3a0010' } });
    const w = r.w + 18, x0 = Math.round(LW / 2 - w / 2), y0 = 148;     // sits just above the smooth subtitle box (line 34)
    win(g, x0, y0, x0 + w, y0 + 21, { border: flash ? WHITE : RED, bg: flash ? '#e8344a' : '#2a0a16', alpha: 0.95 });
    g.drawImage(r.canvas, x0 + 9, y0 + 5);
  }

  // ------------------------------------------------------------ frame
  /** (flood_k09, --look k08b hero shot only: the caller passes { slim: true }) the battle UI collapsed to a slim lyric strip at
   *  the bottom edge (the message text only; no party / enemy panels), the VICTORY banner small above it, no floating
   *  tags (BUG -> FEATURE / hearts would cover Jade at the plant). Without slim the UI is drawn exactly as before. */
  function drawSlim(t, ph) {
    const x0 = 34, x1 = LW - 35, y1 = BAND_B, W = x1 - x0 - 14;
    const L = lyricAt(t); let lyr = null, tr = null, lyrRev = 0, trRev = 0;
    if (L) { const S = SUBS[L.id]; lyr = S.top.startsWith('Bug') ? { spans: [{ text: 'Bug', color: RED }, { text: S.top.slice(3), color: WHITE }] } : { text: S.top, color: WHITE };
      lyrRev = crawlCount(t, L.id); tr = S.bot; trRev = Math.floor(clamp01(since(t, L.start + 0.05) * 60 / Math.max(1, Array.from(tr).length)) * Array.from(tr).length + 1e-6); }
    const rl = lyr ? R({ ...lyr, font: 'fp10', maxWidth: W, shadow: SH, reveal: lyrRev }) : null, rt = tr ? R({ text: tr, font: 'fp8', color: SUBC, maxWidth: W, shadow: SH, reveal: trRev }) : null;
    const h = 7 + (rl ? rl.h : 0) + (rt ? rt.h + 1 : 0); const y0 = y1 - Math.max(16, h);
    win(g, x0, y0, x1, y1, { alpha: 0.82 });
    let y = y0 + 4; if (rl) { g.drawImage(rl.canvas, x0 + 7, y); y += rl.h + 1; } if (rt) g.drawImage(rt.canvas, x0 + 7, y);
    const b = bannerAt(t);
    if (b && b.kind === 'victory') { const u = since(t, b.t0); const r = R({ text: Math.floor(u * 6) % 2 === 0 ? '★ VICTORY ★' : '☆ VICTORY ☆', font: 'fp8', color: GOLD_HI, shadow: SH });
      const bw = r.w + 10, bx = Math.round(LW / 2 - bw / 2); win(g, bx, y0 - 15, bx + bw, y0 - 3, { border: GOLD, bg: NAVY2, alpha: 0.94 }); g.drawImage(r.canvas, bx + 5, y0 - 13); }
    // (r5) the TRIPLE TECH banner survives the slim strip (small, above it); the conversion cards keep their BUG -> FEATURE tag
    if (b && b.kind === 'tech' && slimTags) { const r1 = R({ text: 'TRIPLE TECH · ', font: 'fp8', color: GOLD_HI, shadow: SH }), r2 = R({ spans: rainbow('一笔一画'), font: 'fp8', shadow: SH });
      const bw = r1.w + r2.w + 10, bx = Math.round(LW / 2 - bw / 2); win(g, bx, y0 - 15, bx + bw, y0 - 3, { border: GOLD, bg: NAVY2, alpha: 0.94 }); g.drawImage(r1.canvas, bx + 5, y0 - 13); g.drawImage(r2.canvas, bx + 5 + r1.w - 1, y0 - 13); }
    if (slimTags) drawTags(t, 'feature');
    void ph;
  }
  /** (r5, act4_r5 REQUEST 4) the last fight's message window as a slim strip: the lyric (lines 39 / 40) + the battle text line */
  function drawSlimFinal(t) {
    const x0 = 34, x1 = LW - 35, y1 = BAND_B, W = x1 - x0 - 14;
    const L = lyricAt(t); let lyr = null, tr = null, lyrRev = 0, trRev = 0;
    if (L) { const S = SUBS[L.id]; lyr = { text: S.top, color: WHITE }; lyrRev = crawlCount(t, L.id); tr = S.bot; trRev = Math.floor(clamp01(since(t, L.start + 0.05) * 60 / Math.max(1, Array.from(tr).length)) * Array.from(tr).length + 1e-6); }
    const actE = lastAt(t, actionList()); const act = actE?.[1] || '';
    const actN = actE ? Math.floor(clamp01(since(t, actE[0]) * 75 / Math.max(1, act.length)) * act.length + 1e-6) : 0;
    const rl = lyr ? R({ ...lyr, font: 'fp10', maxWidth: W, shadow: SH, reveal: lyrRev }) : null, rt = tr ? R({ text: tr, font: 'fp8', color: SUBC, maxWidth: W, shadow: SH, reveal: trRev }) : null;
    const ra = act ? R({ text: act, font: 'fp8', color: ACT_COL[actE[2]] || GOLD_HI, maxWidth: W, shadow: SH, reveal: actN }) : null;
    const h = 7 + (rl ? rl.h : 0) + (rt ? rt.h + 1 : 0) + (ra ? ra.h + 2 : 0); const y0 = y1 - Math.max(16, h);
    win(g, x0, y0, x1, y1, { alpha: 0.82 });
    let y = y0 + 4; if (rl) { g.drawImage(rl.canvas, x0 + 7, y); y += rl.h + 1; } if (rt) { g.drawImage(rt.canvas, x0 + 7, y); y += rt.h + 2; } if (ra) g.drawImage(ra.canvas, x0 + 7, y);
  }
  /** (v4, Tier 1 "strip the UI") only the three kept game jokes survive here: the prompt field (`> let's dance`, the rap's
   *  prompt-box appearance), the BUG → FEATURE stamps, and the party joining (THE ERASER, PARTY 8 → 9, a compact top strip on
   *  the join beat). No party / enemy / command windows, no lyric message window (SmoothSubs carries the lyrics), no ♥ / MISS /
   *  GUARD tags, no TRIPLE TECH / VICTORY banners, no recruit dialog, no "draws near" warning, nothing in the clear frames
   *  (core/ui.js CLEAR_FRAMES: the paint flood 119.0-123.354 holds the bugs' recruit beat, which stays as the staged 3D action). */
  function drawV4(t) {
    if (clearFrameAt(t)) return false;
    let any = false;
    for (const cc of cmdList()) { const F = cc.field; if (F && on(t, F.open) && !on(t, F.close)) { drawField(t, cc); any = true; } }
    if (t >= BATTLE.enc && t < 119.0 && battleTagsAt(t).some((tg) => tg.kind === 'feature')) { drawTags(t, 'feature'); any = true; }
    if (on(t, BATTLE.final.join) && t < 150.6) { drawJoinV4(t); any = true; }
    return any;
  }
  function drawJoinV4(t) {
    const party = partyAt(t); const n = party.length, from = 8;
    const r1 = R({ text: `PARTY  ${from} → `, font: 'fp10', color: WHITE, shadow: SH }), r2 = R({ text: String(n), font: 'fp10', color: GOLD_HI, shadow: SH });
    const step = 18, w = 8 + r1.w + r2.w + 6 + n * step + 4, h = 24;
    const x0 = Math.round(LW / 2 - w / 2), y0 = 4;
    win(g, x0, y0, x0 + w, y0 + h);
    g.drawImage(r1.canvas, x0 + 7, y0 + 7); g.drawImage(r2.canvas, x0 + 7 + r1.w - 1, y0 + 7);
    party.forEach((id, i) => {
      const px = x0 + 8 + r1.w + r2.w + 6 + i * step, py = y0 + 4;
      const pop = id === 'eraser' && since(t, BATTLE.final.join) < 0.1;
      fill(g, px - 1, py - 1, px + 16, py + 16, pop ? WHITE : NAVY0);
      const sp = P[id]; if (sp && !pop) g.drawImage(sp, px + Math.floor((16 - sp.width) / 2), py + Math.floor((16 - sp.height) / 2));
      outline(g, px - 1, py - 1, px + 16, py + 16, id === 'eraser' ? '#ff9ec0' : i >= 3 ? GOLD : SLATE_HI);
    });
  }
  function draw(t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, LW, LH); g.imageSmoothingEnabled = false;
    if (UI_V4()) return drawV4(t) || swirlFrame(t) >= 0;
    const ph = phaseAt(t);
    if (ph.phase === 'off') return false;
    if (slim && (ph.phase === 'battle' || ph.phase === 'victory')) { drawSlim(t, ph); return true; }   // no floating tags over the hero shot
    if (ph.phase === 'near') { drawNear(t); return true; }
    const s = slideAt(t, ph); if (s <= 0) { return swirlFrame(t) >= 0; }
    const dy = Math.round((1 - s) * (LH - BAND_Y + 25));
    g.save(); g.translate(0, dy);
    const c = cmdAt(t);
    if (ph.left) { if (c) drawCmd(t, c, ph.left[0], ph.left[1], BAND_Y); else drawEnemies(t, ph.left[0], ph.left[1], BAND_Y); }
    if (ph.slimMsg) drawSlimFinal(t); else drawMsg(t, ph.msg[0], ph.msg[1], BAND_Y, ph);
    if (ph.party) { if (ph.strip) drawPartyStrip(t, ph.party[0], ph.party[1], BAND_Y); else drawPartyRows(t, ph.party[0], ph.party[1], BAND_Y); }   // (r5) none in the last fight
    if (c) drawSkills(t, c);
    for (const cc of cmdList()) drawField(t, cc);   // a field may outlive its menu (final boss)
    if (ph.phase === 'final' && on(t, BATTLE.final.enemyIn) && !on(t, BATTLE.final.join)) drawEraserWin(t);
    const b = bannerAt(t); if (b) drawBanner(t, b, ph.msg);
    drawFlowers(t, ph.msg);
    g.restore();
    if (dy < 20) { if (nameTags) drawNameTags(t); drawTags(t); }
    return true;
  }

  const api = {
    scene, cam, ui2d: { scene, cam }, canvas: cv,
    /** o: { anchors: { id: [u, v] | THREE.Vector3 }, camera (for Vector3 anchors), nameTags: bool } */
    update(t, o = {}) {
      anchors = o.anchors || {}; camera = o.camera || null; nameTags = !!o.nameTags; slim = !!o.slim; slimTags = !!o.slimTags;   // slim: (flood_k09) opt-in, see drawSlim; slimTags: (r5) + feature tags / tech banner
      const k = swirlFrame(t);
      swirl.visible = k >= 0; swMat.uniforms.uK.value = Math.max(0, k);
      quad.visible = draw(t); tex.needsUpdate = true;
      scene.visible = swirl.visible || quad.visible;
      return api;
    },
    /** draw over whatever is in `target` (for scenes that don't use make3D's ui2d) */
    render(renderer, target = null) {
      if (!scene.visible) return;
      const ac = renderer.autoClear; renderer.autoClear = false; renderer.setRenderTarget(target); renderer.clearDepth();
      renderer.render(scene, cam); renderer.autoClear = ac;
    },
    project,
    state: battleAt,
  };
  return api;
}

/** world point -> [u, v] normalized screen (0..1, top-left origin); null if behind the camera */
const _v = new THREE.Vector3();
export function project(p, camera) {
  _v.copy(p).project(camera); if (_v.z > 1) return null;
  return [(_v.x + 1) / 2, (1 - _v.y) / 2];
}
