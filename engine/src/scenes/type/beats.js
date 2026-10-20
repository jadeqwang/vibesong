// TYPE (v4 Pass B): the type beats. Each beat draws onto a transparent canvas the size of the output frame
// (canvas px, y down) as a pure function of song time t. Positions are fractions of the frame so 540p review and
// 1080p master match. The 2D glosses use game pixels (320x180 UI grid, pix = H / 180) like core/ui.js.
//
// Rule kept (decisions 2026-10-18): a line is in the world OR in the subtitle bar, never both. Every line drawn here
// is inWorld in show/subtitles.js, so the one subtitle style (SmoothSubs / its pixel twin) never doubles it.
//
//   big character + small gloss (Moongazing's held 你 over "I miss you.", in this video's own big-hanzi look: graphite
//   drawn stroke by stroke in true stroke order, like the 一笔一画 title)
//     zhan   绽   line 24 "...just blossoms" 94.204-100.5: one stroke per beat (11 strokes on the 11 beats 94.204..98.292),
//                 the last lands on "blossoms"; gloss = the sung line in English, written in word by word
//     wutai  舞台 line 27 世界 是我的舞台 109.09-110.41, both on one shot (stage_3d's front-on band shot)
//     da     答   line 35 一笔一画 都是我的回答 125.769-128.9 on the bridge paper card's right margin: 12 strokes, stroke by
//                 stroke while "一笔一画 都是我的" is sung, held over the 128.18 cut through the sung 答 (128.62)
//   in-world glosses for the lines Tier 1 built into the world (they lost their English)
//     yibi   一笔 一画: RETIRED (not in the show since 2026-10-18; the cold-open gloss card at ~4 s already glosses it)
//     void   说出来 它就存在 (34.69-38.23, VOID rows): code comments under the platform rows, typed on the two slams
//     chufa  一切从这里出发 (72.13, act2 editor): a code comment typed under the chant row once 出发 lands
//   the split couplet is couplet.js.
import * as T from '../../show/timing.js';
import { loadHanziVec, graphiteGlyph, gloss, pixelText, progAt, schedule, smooth, clamp01 } from './lib.js';

const GRAPHITE = '#2a2a31';
export const COMMENT = '#86c79a';      // the editor's comment colour (VOID / editor looks)

// ------------------------------------------------------------------------------------------------ big characters
// box = [x, y] top-left as fractions of W / H, S = box size as a fraction of H
export const BIG = {
  zhan: {
    // gloss = the sung line in English (coordinator 2026-10-18: the glosses stay English), written in word by word as sung
    chars: [{ ch: '绽', box: [0.585, 0.06], S: 0.56 }],
    line: 24, glossText: 'everything I love about life just blossoms', glossWords: true, glossAt: [0.742, 0.70], glossSize: 0.036,
    halo: 0.55, out: [100.1, 100.5],
  },
  wutai: {
    // proposal A (coordinator 2026-10-18): 舞台 together on ONE shot across the sung span 109.09-110.41, never split by a cut.
    // Over the front-on band shot (still 08): 舞 in the rose light above Charlie, 台 in the teal light above Ricky, the sky
    // under the arch stays clear for Jade's raised fist; the gloss top centre. The entry follows whatever shot stage_3d puts
    // there (show/main.js splits a type entry at every scene that starts inside it).
    chars: [{ ch: '舞', box: [0.035, 0.02], S: 0.34 }, { ch: '台', box: [0.775, 0.03], S: 0.34 }],
    line: 27, glossText: 'the world is my stage', glossAt: [0.5, 0.08], glossSize: 0.042,
    halo: 0.5, out: [110.36, 110.41],
  },
  da: {
    // drawn on the jade card (125.769-128.18), then held over the cut onto the Charlie | Ricky split frame through its
    // syllable (128.62) to 128.9 (coordinator 2026-10-18; card timing unchanged)
    // on the split frame the right margin is Ricky's face, so after the cut 答 sits on the seam between the two portraits
    // (the clear sky above their shoulders), with a light paper halo over the hatching
    chars: [{ ch: '答', box: [0.685, 0.10], S: 0.5 }],
    line: 35, glossText: 'every stroke is my answer', glossAt: [0.80, 0.71], glossSize: 0.042,
    halo: 0, out: [128.82, 128.9],
    after: { box: [0.5 - 0.21 * 9 / 16, 0.035], S: 0.42, glossAt: [0.5, 0.515], halo: 0.45 },
  },
};

export async function prepareBig(key) {
  const B = BIG[key];
  for (const c of B.chars) c.hv = await loadHanziVec(c.ch);
  const W24 = T.words(24), W27 = T.words(27), W35 = T.words(35);
  if (key === 'zhan') {
    // one stroke per beat: the 11 beats from the verse downbeat (94.204) to the beat of "blossoms" (98.292)
    const beats = T.beatsIn(94.15, 98.35);
    const hv = B.chars[0].hv; const n = hv.n; const st = beats.slice(-n);
    B.chars[0].sched = st.map((a, i) => ({ a, b: a + Math.min(0.34, 0.12 + hv.len[i] / 2200) }));
    B.bloom = W24[W24.length - 1].start;   // "blossoms" 98.237
    B.glossIn = W24[0].start;
    // word-by-word reveal: each word of the gloss is written in over 0.25 s from its sung onset
    const words = B.glossText.split(' ');
    B.glossN = (t) => { let k = 0; words.forEach((w, i) => { const n = w.length + (i < words.length - 1 ? 1 : 0); k += n * clamp01((t - W24[i].start) / 0.25); }); return k; };
  } else if (key === 'wutai') {
    const wu = W27.find((w) => w.w === '舞'), tai = W27.find((w) => w.w === '台');
    // (coordinator 2026-10-19) lyrics_timed line 27 is one syllable early from 是; the stem has 舞 at 109.62. Shift both onto the stem.
    // The card holds to 109.62 (v44), so 舞台 lives on the 0.8 s 3D shot: 舞 109.62-109.92, 台 109.92-110.24.
    void wu; void tai;
    B.chars[0].sched = schedule(B.chars[0].hv, { a: 109.62, b: 109.92 });
    B.chars[1].sched = schedule(B.chars[1].hv, { a: 109.92, b: 110.24 });
    B.glossIn = 109.62;
  } else if (key === 'da') {
    B.after.t = T.nearestBeat(T.word(35, 6).start - 0.2);   // = act4.paper_listen's t0 (the cut to the Charlie | Ricky frame)
    // stroke by stroke over "一笔一画 都是我的" (125.86 -> the card's last frames); 答 completes as 回 is reached
    B.chars[0].sched = schedule(B.chars[0].hv, { a: W35[0].start, b: 128.06 });
    B.glossIn = W35[0].start + 0.15;
  }
  return B;
}

export function drawBig(g, W, H, t, key) {
  const B = BIG[key]; if (!B) return;
  const fade = 1 - smooth(B.out[0], B.out[1], t);
  if (fade <= 0) return;
  for (const c of B.chars) {
    const prog = progAt(c.sched, t); if (!prog.some((p) => p > 0)) continue;
    const done = c.sched[c.sched.length - 1].b;
    let scale = 1, smudge = clamp01((t - c.sched[0].a) / 3) * 0.6, tint = null;
    if (key === 'zhan' && t >= B.bloom) {   // "blossoms": the character opens a little and the stroke she just drew takes a petal wash
      const u = t - B.bloom; scale = 1 + 0.05 * Math.sin(Math.min(1, u / 0.5) * Math.PI / 2) ; smudge = 0.6 + 0.4 * smooth(0, 1.2, u);
      tint = { color: '#ff9fb4', alpha: 0.42 * smooth(0, 0.35, u), strokes: [c.hv.n - 1, c.hv.n - 2, c.hv.n - 3] };
    }
    const A = B.after && t >= B.after.t ? B.after : null;
    const box = A ? A.box : c.box, S = (A ? A.S : c.S) * H;
    graphiteGlyph(g, c.hv, { x: box[0] * W, y: box[1] * H, S, prog, alpha: fade, halo: A ? A.halo : B.halo, haloColor: B.haloColor, smudge, scale, tint, rgb: c.rgb,
      tip: t < done ? '#ffd23f' : null, seed: 11 + c.ch.charCodeAt(0) % 97 });
  }
  const GA = B.after && t >= B.after.t ? B.after.glossAt : B.glossAt;
  gloss(g, B.glossText, { x: GA[0] * W, y: GA[1] * H, size: B.glossSize * H, t, a: B.glossIn, dur: 0.7, alpha: fade, n: B.glossN ? B.glossN(t) : null,
    color: GRAPHITE, halo: B.after && t >= B.after.t ? 1 : (B.glossHalo ?? (B.halo > 0 ? 1 : 0)) });
}

// ------------------------------------------------------------------------------------------------ 2D glosses
// p = game-pixel size in canvas px (H / 180); UI coords are game px with y UP (0 = bottom), like Stage2D.addUI.
export function drawGloss2D(g, W, H, t, key, env = {}) {
  const p = H / 180, k = Math.max(1, Math.round(p));
  const ui = (sx, sy) => [sx * p, H - sy * p];
  if (key === 'yibi') {
    // a graphite note on the page under the title row (act1/press_start.js: title slots y 112-176, START below at ~50),
    // in world px so it rides the camera's dive: "stroke" written on 笔 (11.40), "by stroke" on 画 (12.31); it leaves as
    // the dive starts (12.95), before the level card (13.02), so the frame never holds two text layers
    const cam = env.cam; if (!cam) return;
    const z = cam.zoom, kk = Math.max(1, Math.round(p * z)), txt = 'stroke by stroke';
    const W4 = T.words(4); const rev = clamp01((t - W4[1].start) / 0.22) * 7 + clamp01((t - W4[3].start) / 0.3) * 9;
    const al = 1 - smooth(12.93, 13.0, t); if (rev <= 0 || al <= 0) return;
    const [sx, sy] = cam.toScreen(env.yibiAt ? env.yibiAt[0] : 26, env.yibiAt ? env.yibiAt[1] : 106); const [x, y] = ui(sx, sy);
    pixelText(g, txt, { x, y, k: kk, font: 'fp10', color: '#4a4a50', reveal: rev, alpha: al });
    return;
  }
  if (key === 'void') {
    // world space (kaizo VOID rows: act1/kaizo.js ROW1 x0 = edge+60 y0 = -66, ROW2 x0 = edge+188 y0 = -78, 3x fp12 tiles)
    const cam = env.cam; if (!cam) return;
    const z = cam.zoom, kk = Math.max(1, Math.round(p * z));
    const out = 1 - smooth(38.25, 38.6, t);
    const lines = [{ text: '// say it out loud,', a: 35.64, wx: env.edge + 60, wy: -66 - 2 }, { text: '// and it exists', a: 36.49, wx: env.edge + 188, wy: -78 - 2 }];
    for (const L of lines) {
      const rev = clamp01((t - L.a) / 0.5) * L.text.length; if (rev <= 0) continue;
      const [sx, sy] = cam.toScreen(L.wx, L.wy); const [x, y] = ui(sx, sy);
      pixelText(g, L.text, { x, y, k: kk, font: 'fp10', color: COMMENT, reveal: rev, alpha: out });
    }
    return;
  }
  if (key === 'chufa') {
    // UI space, under the chant row (act2/chorus.js: 7 chars at x 56 + 28 i, y 144, fp12 x2, centred), left-aligned to
    // its first character and short enough to stay clear of the big rainbow 出发; typed once 出发 has landed, gone with
    // the row (75.4)
    const txt = '// everything starts here'; const a = 73.62;
    const rev = clamp01((t - a) / 0.6) * txt.length; if (rev <= 0 || t >= 75.4) return;
    const [x, y] = ui(env.chufaAt ? env.chufaAt[0] : 44, env.chufaAt ? env.chufaAt[1] : 131);
    pixelText(g, txt, { x, y, k, font: 'fp8', color: COMMENT, reveal: rev, cursor: rev < txt.length || Math.floor(t * 4) % 2 === 0, cursorColor: COMMENT });
  }
}
