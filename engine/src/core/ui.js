// UI widgets for the crisp overlay pass (stage.addUI). Coordinates: 320x180 screen game-pixels, (0,0) bottom-left.
//   HUD          Lost Vikings bottom bar: 3 portraits (+singing frame), 2 item slots each, LINES OF CODE: 0
//   Subtitle     ONE bilingual slot: sung language on top (karaoke from word times), translation below (fp10)
//   subtitleFor(t, lineId)  -> { top spans, bot } from show/subtitles.js + lyric word times (null if none)
//   DialogueBox  portrait + typewriter text (Lost Vikings banter), talking portrait toggles on syllables
//   PromptBox    "> text" typed on with a blinking block cursor
//   Bubble       speech bubble with text (world or UI)
//   Banner       centred stamped text on a panel (LEVEL 1-1 · DRAFT, LEVEL NOT FOUND ...)
import * as THREE from 'three';
import { Quad, rect, canvasTex } from './gfx.js';
import { TextSprite } from './text.js';
import { panelCanvas, iconCanvas, bubbleCanvas } from './props.js';
import { PAL } from './palette.js';
import { CAST, HUD_ORDER } from '../show/cast.js';
import { SUBS } from '../show/subtitles.js';
import * as T from '../show/timing.js';

const texCache = new Map();
function panelTex(w, h, style) { const k = `${w}x${h}:${style}`; if (!texCache.has(k)) texCache.set(k, canvasTex(panelCanvas(w, h, style))); return texCache.get(k); }
export function panel(w, h, style) { return new Quad(panelTex(w, h, style), w, h); }

// ------------------------------------------------------------------ HUD
export const HUD_H = 36;
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
  }
  /** s: { singing: {jade:true}, alert: bool (show LEVEL NOT FOUND instead of the counter), alertOn: blink phase, loc: number } */
  set(s = {}) {
    for (const [id, p] of Object.entries(this.portraits)) {
      const f = s.singing?.[id] ? 1 : 0; p.q.setRect(f / p.n, 0, 1 / p.n, 1);
    }
    const al = !!s.alert && s.alertOn !== false; this.alert.visible = al; this.locLabel.visible = !al; this.locNum.visible = !al; // alert blinks with the counter
    if (s.loc !== undefined) this.locNum.set({ text: String(s.loc) });   // LINES OF CODE counter (show/loc.js locAt(t))
    return this;
  }
}

// ------------------------------------------------------------------ subtitles
/** Build subtitle content for lyric line `id` at time t: karaoke spans for the sung line + translation. */
export function subtitleFor(t, id, { lit = PAL.yellow, unlit = PAL.subTop, hold = 0.35, lead = 0.12 } = {}) {
  const S = SUBS[id]; if (!S) return null;
  const L = T.line(id); if (!L) return null;
  if (t < L.start - lead || t > L.end + hold) return null;
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

export class Subtitle extends THREE.Group {
  constructor({ y = HUD_H + 3, maxWidth = 300 } = {}) {
    super();
    this.y = y; this.maxWidth = maxWidth;
    this.box = rect(1, 1, PAL.subBox, 0.78); this.add(this.box);
    this.top = new TextSprite({ text: '', font: 'fp12', maxWidth, align: 'center', shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'bc' }); this.add(this.top);
    this.bot = new TextSprite({ text: '', font: 'fp10', color: PAL.subBot, maxWidth, align: 'center', shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'bc' }); this.add(this.bot);
    this.visible = false;
  }
  /** content: { top: spans|null, bot: string|null } or null to hide */
  set(c, { y = this.y, opacity = 1 } = {}) {
    if (!c || (!c.top && !c.bot)) { this.visible = false; return this; }
    this.visible = true;
    const pad = 3; let h = pad;
    if (c.bot) { this.bot.visible = true; this.bot.set({ text: c.bot }); this.bot.place(160, y + h); h += this.bot.h + 1; } else this.bot.visible = false;
    if (c.top) { this.top.visible = true; this.top.set({ spans: c.top.map((s) => ({ ...s })) }); this.top.place(160, y + h); h += this.top.h; } else this.top.visible = false;
    h += pad - 1;
    const w = Math.max(c.top ? this.top.w : 0, c.bot ? this.bot.w : 0) + 10;
    this.box.setSize(w, h); this.box.place(160 - Math.floor(w / 2), y);
    this.box.material.uniforms.opacity.value = 0.78 * opacity; this.top.opacity = opacity; this.bot.opacity = opacity;
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
