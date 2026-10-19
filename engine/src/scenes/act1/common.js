// Shared Act I building blocks: the 一笔一画 title layout, the travelling pencil rig, the Act I atlas.
import { Hanzi2D } from '../../core/hanzi2d.js';
import { TextSprite } from '../../core/text.js';
import { Atlas, addParticleSprites } from '../../core/fx.js';
import { pixelCanvas } from '../../core/gfx.js';
import { flowerCanvas, FLOWER_COLORS } from '../../core/props.js';
import { PAL } from '../../core/palette.js';
import { Z } from '../../core/stage2d.js';
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { panel } from '../../core/ui.js';

/** Title layout in world px (zoom-1 framing = the 320x180 screen). */
export const TITLE = { size: 64, y0: 74, xs: [17, 91, 165, 239], chars: ['一', '笔', '一', '画'], pinyin: ['yī', 'bǐ', 'yī', 'huà'] };

export async function buildTitle(st, { y0 = TITLE.y0, xs = TITLE.xs, style = 'graphite', pinyin = true, z = Z.PLATFORM } = {}) {
  const hz = [];
  for (let k = 0; k < 4; k++) { const h = await Hanzi2D.create(TITLE.chars[k], { size: TITLE.size, style }); h.place(xs[k], y0); st.add(h.group, z); hz.push(h); }
  const py = [];
  if (pinyin) for (let k = 0; k < 4; k++) {
    const s = new TextSprite({ text: TITLE.pinyin[k], font: 'fp12', color: PAL.g0 }, { anchor: 'bc' });
    s.place(xs[k] + TITLE.size / 2, y0 - 15); st.add(s, Z.TEXT); py.push(s);
  }
  return { hz, py };
}

/**
 * Pencil that travels between drawing plans: during a plan it sits on the stroke tip; between plans it
 * lifts and glides (arc) from the last plan's end point to the next plan's start point. Pure in t.
 * plans: [{ h: Hanzi2D, k: plan index }]   (in time order)
 */
export class PencilRig {
  constructor(pencil, plans, { lift = 14, angle = -32, exit = null } = {}) {
    this.pencil = pencil; this.lift = lift; this.angle = angle; this.exit = exit;
    this.segs = plans.map(({ h, k }) => ({ h, ...h.planEnds(k) }));
  }
  at(t) {
    const S = this.segs;
    for (let i = 0; i < S.length; i++) {
      const s = S[i];
      const tip = s.h.tipAt(t);
      if (tip.active) return { x: tip.x, y: tip.y, drawing: true, i };
      if (t < s.t0) {
        if (i === 0) return { x: s.start[0], y: s.start[1] + this.lift, drawing: false, i };
        const p = S[i - 1]; const u = (t - p.t1) / (s.t0 - p.t1); const e = u * u * (3 - 2 * u);
        return { x: p.end[0] + (s.start[0] - p.end[0]) * e, y: p.end[1] + (s.start[1] - p.end[1]) * e + this.lift * Math.sin(Math.PI * u), drawing: false, i };
      }
    }
    const last = S[S.length - 1];
    if (this.exit) { const [tx, ty, dur] = this.exit; const u = Math.min(1, (t - last.t1) / dur); const e = u * u; return { x: last.end[0] + (tx - last.end[0]) * e, y: last.end[1] + (ty - last.end[1]) * e, drawing: false, i: S.length, gone: u >= 1 }; }
    return { x: last.end[0], y: last.end[1] + this.lift, drawing: false, i: S.length };
  }
  apply(t, extra = {}) {
    const p = this.at(t);
    const wob = p.drawing ? Math.sin(t * 40) * 3 : 0;
    this.pencil.set({ x: p.x, y: p.y, angle: this.angle + wob, visible: !p.gone, ...extra });
    return p;
  }
}

/** Act I atlas: particles, flowers, speed lines, eraser crumbs (from the strip), tiles. */
export function act1Atlas(lib) {
  const a = addParticleSprites(new Atlas(1024));
  FLOWER_COLORS.forEach((c, i) => { for (let s = 0; s <= 4; s++) a.add(`flower${i}_${s}`, flowerCanvas(i, s), [2, 0]); });
  for (const L of [6, 10, 14]) a.add('speed' + L, pixelCanvas(L, 1, (g, px) => px(0, 0, PAL.g3, L, 1)), [L, 0]);
  [8, 12, 16, 20, 24].forEach((r) => a.add('arc' + r, arcCanvas(r), [0, r + 1]));
  if (lib?.has('eraser_crumbs')) { const sp = lib.get('eraser_crumbs'); a.addStrip('ecrumb', sp.img, sp.w, sp.h, sp.n, [7, 7]); }
  return a;
}

/** run speed-lines behind an actor (k01 style) */
export function speedLines(batch, t, x, y, facing = 1) {
  const f = Math.floor(t * 30);
  [[12, 'speed14'], [20, 'speed10'], [28, 'speed6']].forEach(([dy, nm], i) => {
    if ((f + i) % 3 === 2) return;
    batch.draw(nm, x - facing * (12 + ((f + i * 2) % 3) * 2), y + dy, { flip: facing < 0 });
  });
}

/** Graphite-on-paper floor column (16 px wide, h tall): pencil-outlined cap block + hatched bricks. */
export function floorColumn(h = 60, variant = 0) {
  return pixelCanvas(16, h, (g, px) => {
    px(0, 0, PAL.paperLo, 16, h);
    // cap block (top 10 px)
    px(0, 0, PAL.g0, 16, 10); px(1, 1, PAL.g4, 14, 8); px(1, 1, PAL.g5, 14, 2);
    for (let i = 0; i < 6; i++) px(3 + i * 2, 4 + (i % 2), PAL.g3, 1, 3);       // hatching
    px(15, 0, PAL.g1, 1, 10);
    // bricks below
    for (let y = 10; y < h; y += 8) {
      const off = ((y - 10) / 8) % 2 ? 8 : 0;
      px(0, y, PAL.g2, 16, 1);
      px((off + 15 + variant * 3) % 16, y + 1, PAL.g2, 1, 7);
      for (let k = 0; k < 4; k++) px((off + 3 + k * 3 + variant) % 16, y + 3 + (k % 3), PAL.g4, 1, 2);
    }
  });
}
/** concentric arc ")" for shockwaves */
export function arcCanvas(r, c1 = '#ffffff', c2 = '#5aa8ff') {
  const W = r + 3, H = 2 * r + 3;
  return pixelCanvas(W, H, (g, px) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5, dy = y + 0.5 - H / 2; const d = Math.hypot(dx, dy); const ang = Math.abs(Math.atan2(dy, dx));
      if (ang > 1.0) continue;
      if (Math.abs(d - r) < 1.0) px(x, y, c1); else if (Math.abs(d - r) < 2.0) px(x, y, c2);
    }
  });
}

/**
 * Lost Vikings level card: The Vibe Coding Song / (一笔一画) (Jade's note 2026-10-15: the song's real name). UI layer. Shared by press_start (the dive) and
 * kaizo (the level opens) so it bridges the scene cut seamlessly: levelCardAt(t) is the same pure placement in both.
 *   const card = buildLevelCard(st); ... card.update(t)
 * In: stamps in on the melisma (13.02), holds over the dive, slides up and away 14.30 -> 14.55.
 */
// (v4) the card leaves BEFORE the first lyric (14.11 floor lyric; it used to fly out through it at 14.30-14.55, critique 0:14):
// out on the melisma's end 13.82, gone by 14.0 (the verse downbeat is 14.012)
export const LEVEL_CARD = { tIn: 13.02, tOut: 13.82, tGone: 14.0, x: 160, y: 104 };
export function buildLevelCard(st, ZUI_LAYER = 20) {
  const g = new THREE.Group();
  const W = 184, H = 44;
  const bg = panel(W, H, 'gold'); bg.place(-W / 2, -H / 2); g.add(bg);
  const l1 = new TextSprite({ text: 'The Vibe Coding Song', font: 'px', color: PAL.gold, shadow: { dx: 1, dy: -1, color: '#3a2a08' } }, { anchor: 'c' }); l1.place(0, 7); g.add(l1);
  const l2 = new TextSprite({ spans: [{ text: '(', color: '#c8cce0' }, { text: '一笔一画', color: PAL.white }, { text: ')', color: '#c8cce0' }], font: 'fp12' }, { anchor: 'c' }); l2.place(0, -9); g.add(l2);
  l1.userData.dz = l2.userData.dz = 0.5;
  st.addUI(g, ZUI_LAYER);
  return {
    group: g,
    update(t) {
      const T0 = T.snap(LEVEL_CARD.tIn); const vis = t >= T0 && t < LEVEL_CARD.tGone; g.visible = vis; if (!vis) return;
      const k = Math.floor((t - T0) * T.fps());
      const sc = [1.3, 1.12, 1.03, 1][Math.min(3, k)];
      const out = T.span(t, LEVEL_CARD.tOut, LEVEL_CARD.tGone, T.ease.inQuad);
      g.scale.set(sc, sc, 1); g.position.set(LEVEL_CARD.x, Math.round(LEVEL_CARD.y + out * 110), 0);
    },
  };
}
