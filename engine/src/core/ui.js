// UI widgets for the crisp overlay pass (stage.addUI). Coordinates: 320x180 screen game-pixels, (0,0) bottom-left.
//   HUD          Lost Vikings bottom bar: 3 portraits (+singing frame), 2 item slots each, LINES OF CODE: 0,
//                active-hero highlight + slot flash, Jade portrait hair canon (jadeHair, default 'down')
//   Subtitle     ONE bilingual slot: sung language on top (karaoke from word times), translation below (fp10)
//   subtitleFor(t, lineId)  -> { top spans, bot } from show/subtitles.js + lyric word times (null if none)
//   DialogueBox  portrait + typewriter text (Lost Vikings banter), talking portrait toggles on syllables
//   PromptBox    "> text" typed on with a blinking block cursor
//   Bubble       speech bubble with text (world or UI)
//   Banner       centred stamped text on a panel (LEVEL 1-1 · DRAFT, LEVEL NOT FOUND ...)
import * as THREE from 'three';
import { Quad, rect, canvasTex, pixelCanvas } from './gfx.js';
import { TextSprite } from './text.js';
import { panelCanvas, iconCanvas, bubbleCanvas } from './props.js';
import { PAL, hexToRgb } from './palette.js';
import { CAST, HUD_ORDER } from '../show/cast.js';
import { SUBS } from '../show/subtitles.js';
import * as T from '../show/timing.js';

const texCache = new Map();
function panelTex(w, h, style) { const k = `${w}x${h}:${style}`; if (!texCache.has(k)) texCache.set(k, canvasTex(panelCanvas(w, h, style))); return texCache.get(k); }
export function panel(w, h, style) { return new Quad(panelTex(w, h, style), w, h); }

// ------------------------------------------------------------------ HUD
export const HUD_H = 36;
/** lit frame (2 px) for the acting hero's portrait well / item slot */
function hiFrame(w, h, c) { return pixelCanvas(w, h, (g, px) => { px(0, 0, c, w, 2); px(0, h - 2, c, w, 2); px(0, 0, c, 2, h); px(w - 2, 0, c, 2, h); px(0, 0, '#ffffff', 4, 1); px(w - 4, h - 1, '#ffffff', 4, 1); }); }
/** Fallback for `portrait_jade_hairdown` (ART_REQUESTS A-2): portrait_jade (2 frames, 32x32) with the bun + pencils removed
 *  and long loose hair painted down both sides to the shoulders. Opaque (HUD well colour) so the bun never shows. */
export function jadePortraitHairDown(lib) {
  const sp = lib.get('portrait_jade');
  return pixelCanvas(64, 32, (g0) => {
    for (let f = 0; f < 2; f++) {
      const cv = pixelCanvas(32, 32, (g) => {
        g.drawImage(sp.img, Math.min(f, sp.n - 1) * 32, 0, 32, 32, 0, 0, 32, 32);
        const WELL = [0x1d, 0x20, 0x30];
        const im = g.getImageData(0, 0, 32, 32), d = im.data;
        const get = (x, y) => { const i = (y * 32 + x) * 4; return d[i + 3] < 128 ? null : [d[i], d[i + 1], d[i + 2]]; };
        const put = (x, y, c) => { const i = (y * 32 + x) * 4; if (!c) { d[i + 3] = 0; return; } const [r, gg, b] = hexToRgb(c); d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255; };
        const dark = (c) => c && c[0] + c[1] + c[2] < 200;
        for (let y = 0; y <= 4; y++) for (let x = 0; x < 32; x++) put(x, y, null);
        for (let x = 0; x < 32; x++) if (get(x, 5) && !dark(get(x, 5))) put(x, 5, '#24202a');
        const HAIR = '#24202a', HL = '#34303a', OUT = '#110f12';
        for (let y = 6; y <= 29; y++) {
          let lx = -1; for (let x = 0; x < 32; x++) { const c = get(x, y); if (c && !dark(c)) { lx = x; break; } }
          if (y >= 9 && y <= 22 && lx > 0) { const x0 = Math.max(3, 6 - Math.floor((y - 9) / 6)); for (let x = x0; x < lx; x++) { const c = get(x, y); if (!c || dark(c)) put(x, y, (x + y) % 5 ? HAIR : HL); } put(x0 - 1, y, OUT); }
          if (y >= 23 && y <= 29) { const x0 = 4 + Math.max(0, y - 27), x1 = 10 - Math.max(0, y - 25); for (let x = x0; x <= x1; x++) put(x, y, (x + y) % 4 ? HAIR : HL); put(x0 - 1, y, OUT); put(x1 + 1, y, OUT); }
          if (y >= 9 && y <= 27) {
            const x1 = Math.min(27, 25 + Math.floor((y - 9) / 7)); let st = -1; for (let x = 31; x >= 0; x--) { const c = get(x, y); if (c && !dark(c) && !(c[0] > 240 && c[1] > 240)) { st = x; break; } }
            const from = y <= 22 ? Math.max(st + 1, 23) : 23; for (let x = from; x <= x1; x++) { const c = get(x, y); if (!c || dark(c) || y > 22) put(x, y, (x * 3 + y) % 7 ? HAIR : HL); } put(x1 + 1, y, OUT);
          }
        }
        for (let i = 0; i < d.length; i += 4) if (d[i + 3] < 128) { d[i] = WELL[0]; d[i + 1] = WELL[1]; d[i + 2] = WELL[2]; d[i + 3] = 255; }
        g.putImageData(im, 0, 0);
      });
      g0.drawImage(cv, f * 32, 0);
    }
  });
}
export class HUD extends THREE.Group {
  constructor(lib) {
    super();
    this.add(panel(320, HUD_H, 'hud'));
    this.portraits = {}; this.slots = {};
    HUD_ORDER.forEach((id, i) => {
      const x0 = 4 + i * 76;
      const well = panel(34, 34, 'well'); well.place(x0, 1); this.add(well);
      const sp = lib.get(CAST[id].portrait);
      const p = new Quad(sp.tex, 32, 32); p.setRect(0, 0, 1 / sp.n, 1); p.place(x0 + 1, 2); this.add(p); this.portraits[id] = { q: p, n: sp.n };
      const icons = id === 'jade' ? ['pencil_graphite', 'pencil_rainbow'] : id === 'charlie' ? ['hat', null] : ['guitar', null];
      icons.forEach((ic, k) => {
        const w = panel(18, 18, 'well'); w.place(x0 + 37 + k * 19, 9); this.add(w);
        if (ic) { const q = new Quad(canvasTex(iconCanvas(ic)), 14, 14); q.place(x0 + 39 + k * 19, 11); this.add(q); this.slots[id + k] = q; }
      });
    });
    const lw = panel(84, 34, 'well'); lw.place(232, 1); this.add(lw);
    this.locLabel = new TextSprite({ text: 'LINES OF CODE:', font: 'sk', color: '#c8cce0' }, { anchor: 'bc' }); this.locLabel.place(274, 21); this.add(this.locLabel);
    this.locNum = new TextSprite({ text: '0', font: 'px', color: PAL.red, shadow: { dx: 1, dy: -1, color: '#40101a' } }, { anchor: 'bc' }); this.locNum.place(274, 6); this.add(this.locNum);
    this.alert = new TextSprite({ text: 'LEVEL NOT FOUND', font: 'sk', color: PAL.red }, { anchor: 'bc' }); this.alert.place(274, 13); this.alert.visible = false; this.add(this.alert);
    // Jade portrait canon: hair DOWN whenever she holds the pencils (the default from 17.38 on; see set({ jadeHair })).
    // Uses the art-dept strip `portrait_jade_hairdown` when it exists, else a code-made overlay of portrait_jade.
    const jp = this.portraits.jade;
    if (jp) {
      jp.texUp = jp.q.material.uniforms.map.value;
      if (lib.has('portrait_jade_hairdown')) { const sp = lib.get('portrait_jade_hairdown'); jp.texDown = sp.tex; jp.nDown = sp.n; }
      else { jp.texDown = canvasTex(jadePortraitHairDown(lib)); jp.nDown = 2; }
      jp.nUp = jp.n;
    }
    // active-hero highlight (Lost Vikings): lit portrait frame + item slot flash on ability use. Drawn last = on top.
    this.hi = new Quad(canvasTex(hiFrame(36, 36, PAL.yellow)), 36, 36); this.hi.visible = false; this.add(this.hi);
    this.slotHi = new Quad(canvasTex(hiFrame(20, 20, '#ffffff')), 20, 20); this.slotHi.visible = false; this.add(this.slotHi);
    this.slotFill = rect(16, 16, '#ffffff', 0.55); this.slotFill.visible = false; this.add(this.slotFill);
    this.hair = 'down';
  }
  /** s: { singing: {jade:true}, alert: bool (show LEVEL NOT FOUND instead of the counter), alertOn: blink phase, loc: number,
   *       jadeHair: 'down' (default: pencils in hand, 17.38 on) | 'up' (bun + crossed pencils, hands empty),
   *       active: 'jade'|'charlie'|'ricky'|null (lit portrait frame), slot: 0|1|null (that hero's item slot outlined),
   *       slotFlash: 0..1 (white flash in the slot on ability use) }
   *  All new keys are opt-in and sticky like the others; omit them and the HUD looks as before (plus Jade hair DOWN). */
  set(s = {}) {
    if (s.jadeHair !== undefined) this.hair = s.jadeHair === 'up' ? 'up' : 'down';
    const jp = this.portraits.jade;
    if (jp && jp.texDown) { const down = this.hair === 'down'; const tex = down ? jp.texDown : jp.texUp; if (jp.q.material.uniforms.map.value !== tex) jp.q.material.setMap(tex); jp.n = down ? jp.nDown : jp.nUp; }
    for (const [id, p] of Object.entries(this.portraits)) {
      const f = s.singing?.[id] ? 1 : 0; p.q.setRect(Math.min(f, p.n - 1) / p.n, 0, 1 / p.n, 1);
    }
    if (s.active !== undefined) this.active = s.active;
    if (s.slot !== undefined) this.slot = s.slot;
    if (s.slotFlash !== undefined) this.slotFlash = s.slotFlash;
    const ai = this.active ? HUD_ORDER.indexOf(this.active) : -1;
    this.hi.visible = ai >= 0; if (ai >= 0) this.hi.place(4 + ai * 76 - 1, 0);
    const sl = ai >= 0 && this.slot !== null && this.slot !== undefined;
    this.slotHi.visible = sl; this.slotFill.visible = sl && (this.slotFlash || 0) > 0.02;
    if (sl) { const x = 4 + ai * 76 + 37 + this.slot * 19; this.slotHi.place(x - 1, 8); this.slotFill.place(x + 1, 10); this.slotFill.material.uniforms.opacity.value = 0.7 * (this.slotFlash || 0); }
    const al = !!s.alert && s.alertOn !== false; this.alert.visible = al; this.locLabel.visible = !al; this.locNum.visible = !al; // alert blinks with the counter
    if (s.loc !== undefined) this.locNum.set({ text: String(s.loc) });   // LINES OF CODE counter (show/loc.js locAt(t))
    return this;
  }
}

// ------------------------------------------------------------------ subtitles
// (v4, ONE lyric system, docs/decisions.md 2026-10-18) every sung line uses one bilingual style in one fixed slot, bottom centre:
// the sung language on top (white, karaoke-lit yellow SUB_LIT from the word times), the translation below (SUB_BOT), on a
// translucent navy box. 3D / smooth scenes draw it with act3/common.js SmoothSubs; 2D scenes with the pixel Subtitle below
// (same colours, same slot: box bottom at 4 % of the frame height = SUB_Y game px). A line built into the world (SUBS inWorld)
// gets NO subtitle at all: subtitleFor() returns null for it.
export const SUB_LIT = '#ffd23f', SUB_UNLIT = '#ffffff', SUB_BOT = '#d6e0ff', SUB_Y = 7;
/** (v4) clear frames: ZERO text / UI layers (no subtitle, no HUD, no menu) in these song-time windows [t0, t1):
 *  drop 1 (the impact -> verse 2), the paint flood, the 画 slam (the slam transient -> line 39's lead-in; line 38 is sung
 *  out by 138.7, so its held tail is not brought back), drop 2 (the impact -> the outro's first vocal). Scenes ask clearFrameAt(t). */
export const CLEAR_FRAMES = [[80.81, 94.204, 'drop 1'], [119.0, 123.354, 'paint flood'], [139.395, 143.36, '画 slam'], [174.395, 186.65, 'drop 2']];
export const clearFrameAt = (t) => CLEAR_FRAMES.some(([a, b]) => t >= a - 1e-6 && t < b);
/** Build subtitle content for lyric line `id` at time t: karaoke spans for the sung line + translation (null: no line, or in-world). */
export function subtitleFor(t, id, { lit = SUB_LIT, unlit = SUB_UNLIT, hold = 0.35, lead = 0.12 } = {}) {
  const S = SUBS[id]; if (!S || S.inWorld || clearFrameAt(t)) return null;
  const L = T.line(id); if (!L) return null;
  // (v4B type M4) the bar leads the FIRST SUNG WORD, not the line's start: line 41's start stays 154.26 (act4 main3d keys
  // K.gang to it) while "And" is sung at 155.90 after a wordless ad-lib, so a start-keyed bar showed 1.6 s early.
  // Every other line's first word is its start, so they are unchanged.
  const s0 = Math.max(L.start, L.words?.[0]?.start ?? L.start);
  if (t < s0 - lead || t > L.end + hold) return null;
  // (v4B type M4) a clear frame that opened while this line was up ends it: its hold never pops back after the clear frame
  // (line 33's 0.25 s hold re-showed it for 2 frames at 123.354-123.41, baked into the couplet's sketched half)
  if (CLEAR_FRAMES.some(([a, b]) => a > s0 - lead && a <= L.end + hold && t >= b)) return null;
  let spans = null;
  if (!S.inWorld) {
    const ws = L.words || []; const chars = Array.from(S.top);
    // assign non-space characters of the display text to words in order (works for zh words of 1-2 chars and en words)
    spans = [];
    if (S.sung === 'zh') {
      let wi = 0, used = 0;
      for (const ch of chars) {
        if (ch === ' ' || ch === '，') { spans.push({ text: ch, color: unlit }); continue; }
        const w = ws[Math.min(wi, ws.length - 1)];
        const on = w && t >= w.start;
        spans.push({ text: ch, color: on ? lit : unlit });
        used++; if (w && used >= Array.from(w.w).length) { wi++; used = 0; }
      }
    } else {
      const toks = S.top.split(' ');
      toks.forEach((tok, i) => { const w = ws[Math.min(i, ws.length - 1)]; spans.push({ text: tok + (i < toks.length - 1 ? ' ' : ''), color: w && t >= w.start ? lit : unlit }); });
    }
  }
  return { top: spans, bot: S.bot, sung: S.sung, inWorld: !!S.inWorld };
}

/** the pixel version of the one subtitle style (see SUB_* above): fixed slot, bottom centre (y is ignored since v4) */
const SUB_ALPHA = 0.62;
export class Subtitle extends THREE.Group {
  constructor({ maxWidth = 300 } = {}) {
    super();
    this.y = SUB_Y; this.maxWidth = maxWidth;
    this.box = rect(1, 1, PAL.subBox, SUB_ALPHA); this.add(this.box);
    this.top = new TextSprite({ text: '', font: 'fp12', maxWidth, align: 'center', shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'bc' }); this.add(this.top);
    this.bot = new TextSprite({ text: '', font: 'fp10', color: SUB_BOT, maxWidth, align: 'center', shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'bc' }); this.add(this.bot);
    this.visible = false;
  }
  /** content: { top: spans|null, bot: string|null } or null to hide */
  set(c, { opacity = 1 } = {}) {
    const y = SUB_Y;
    if (!c || (!c.top && !c.bot)) { this.visible = false; return this; }
    this.visible = true;
    const pad = 3; let h = pad;
    if (c.bot) { this.bot.visible = true; this.bot.set({ text: c.bot }); this.bot.place(160, y + h); h += this.bot.h + 1; } else this.bot.visible = false;
    if (c.top) { this.top.visible = true; this.top.set({ spans: c.top.map((s) => ({ ...s })) }); this.top.place(160, y + h); h += this.top.h; } else this.top.visible = false;
    h += pad - 1;
    const w = Math.max(c.top ? this.top.w : 0, c.bot ? this.bot.w : 0) + 10;
    this.box.setSize(w, h); this.box.place(160 - Math.floor(w / 2), y);
    this.box.material.uniforms.opacity.value = SUB_ALPHA * opacity; this.top.opacity = opacity; this.bot.opacity = opacity;
    return this;
  }
}

// ------------------------------------------------------------------ dialogue / prompt / bubble / banner
export class DialogueBox extends THREE.Group {
  constructor(lib, { w = 300, h = 48, x = 10, y = 6 } = {}) {
    super();
    this.lib = lib; this.add(panel(w, h, 'dialog')); this.children[0].place(x, y);
    this.pwell = panel(36, 36, 'well'); this.pwell.place(x + 6, y + (h - 36) / 2); this.add(this.pwell);
    this.portrait = new Quad(null, 32, 32); this.portrait.place(x + 8, y + (h - 32) / 2 + 0); this.add(this.portrait);
    this.text = new TextSprite({ text: '', font: 'fp12', maxWidth: w - 58, color: PAL.white }, { anchor: 'tl' }); this.text.place(x + 50, y + h - 6); this.add(this.text);
  }
  /** s: { who:'jade', text, reveal (chars), talking (bool) } */
  set(s) {
    const sp = this.lib.get(CAST[s.who].portrait); this.portrait.material.setMap(sp.tex); this.portrait.setRect((s.talking ? 1 : 0) / sp.n, 0, 1 / sp.n, 1);
    this.text.set({ text: s.text, reveal: s.reveal }); return this;
  }
  /** typewriter synced to lyric words: reveal = characters of words already started */
  static revealFromWords(t, text, words) { let n = 0, pos = 0; for (const w of words) { const i = text.indexOf(w.w.replace(/[,!?.]$/, ''), pos); if (i < 0) continue; if (t >= w.start) { n = i + w.w.length; } pos = i + 1; } return n; }
}
export class PromptBox extends THREE.Group {
  constructor({ w = 220, x = 50, y = 80 } = {}) {
    super(); this.w = w; this.x0 = x; this.y0 = y;
    this.bg = panel(w, 22, 'dialog'); this.bg.place(x, y); this.add(this.bg);
    this.text = new TextSprite({ text: '', font: 'fp12', color: PAL.termGreen }); this.text.place(x + 7, y + 5); this.add(this.text);
    this.cursor = rect(6, 10, PAL.termGreen); this.add(this.cursor);
  }
  /** s: { text, reveal, t (for the 2 Hz blink) } */
  set(s) {
    const full = '> ' + s.text; const n = s.reveal === undefined ? full.length : 2 + s.reveal;
    this.text.set({ text: full, reveal: n });
    const r = this.text.r; const c = r.chars[Math.min(n, r.chars.length) - 1];
    const cx = c ? c.x + c.w + 1 : 0; this.cursor.place(this.x0 + 7 + cx, this.y0 + 6);
    this.cursor.visible = Math.floor((s.t || 0) * 4) % 2 === 0 || n < full.length; return this;
  }
}
export class Bubble extends THREE.Group {
  constructor(spec = {}) {
    super(); this.bg = new Quad(null, 1, 1); this.add(this.bg);
    this.text = new TextSprite({ text: '', font: 'fp12', color: PAL.ink, ...spec }, { anchor: 'bl' }); this.add(this.text); this._k = ''; this.text.userData.dz = 0.5;
  }
  /** s: { text|spans, x, y (tail tip), reveal } */
  /** s: { text|spans, x, y (tail tip), reveal, scale (integer text scale, default 1), full (size the bubble for the full text) } */
  set(s) {
    const sc = s.scale || 1;
    this.text.set({ text: s.text, spans: s.spans, reveal: s.reveal }); this.text.setScale(sc);
    const tw = this.text.w * sc, th = this.text.h * sc;
    const w = tw + 10 + 2 * sc, h = th + 7 + sc, tail = 10, k = `${w}x${h}`;
    if (k !== this._k) { this._k = k; this.bg.material.setMap(canvasTex(bubbleCanvas(w, h, tail))); this.bg.setSize(w, h + 5); }
    this.bg.place(s.x - tail - 1, s.y); this.text.place(s.x - tail - 1 + 5 + sc, s.y + 5 + 3 + Math.floor(sc / 2)); return this;
  }
}
export class Banner extends THREE.Group {
  constructor(spec, { style = 'gold', padX = 10, padY = 6 } = {}) {
    super();
    this.text = new TextSprite(spec, { anchor: 'c' });
    const w = this.text.w * (spec.scale || 1) + padX * 2, h = this.text.h * (spec.scale || 1) + padY * 2;
    this.bg = panel(Math.round(w), Math.round(h), style); this.bg.anchor = [Math.round(w / 2), Math.round(h / 2)]; this.add(this.bg); this.add(this.text); this.text.userData.dz = 0.5;
    if (spec.scale) this.text.setScale(spec.scale);
  }
  place(x, y) { this.bg.place(x, y); this.text.place(x, y); return this; }
}
