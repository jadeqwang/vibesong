// REALITY build bar (game-design pass, docs/game_design_acts1-3.md): the goal the whole chorus fills.
// Owner: ACT II team. Imported by Act II (src/scenes/act2/chorus.js) and the Act III turn team.
//
// API
//   import { buildAt, BuildBar, BAR_LABEL } from '../../show/build_bar.js';
//
//   buildAt(t) -> { visible, pct, label, text, dock, stuck, done }      PURE function of song time t
//     visible  (v4) true from the build (67.778) until the impact (80.81); false outside (was: from ENTER 52.62)
//     pct      0..100 integer, the % shown:
//                0 at 52.62 (ENTER), +20 over the fixtures sweep (55.7-56.3, one step per block drawn),
//                +25 as the functions flood colours the level (57.42-57.8, one step per block coloured),
//                +5 on each "oh" (59.555 / 59.975 / 60.425: switch -> function), then one step per hat that lands
//                and sprouts a chunk (61.3-67.7, 99 hats -> 99%). STUCK at 99 from the build (67.778) until the
//                launch's last hit (79.64) -> 100.
//     label    'REALITY LV1 → LV2'
//     text     the right-hand text: `${pct}%`, or '100% · LOADING…' in the silence (79.87-80.81)
//     dock     0..1 slide-in after ENTER (0.3 s); 1 afterwards
//     stuck    true while it hangs at 99% (67.778-79.64): the widget blinks the % (2 Hz) and blinks the last 1% of the well
//     done     true from 79.64 (100%, gold)
//     glitch   0 or 1..4 while stuck: on every off-beat 8th (beat phase 0.5-0.62) the bar glitches (variant 1..4:
//              '9?%' / 'ERR' / '99.9%' / '9_%' with the panel jolting 1-2 px and the fill flashing red)
//   Act III owns what happens after 77.757 on screen (shatter at the impact etc.); the function already returns
//   pct 100 at 79.64 and visible:false from 80.81.
//
//   const bar = st.addUI(new BuildBar(), ZUI.BANNER);     // Stage2D UI layer (320x180 fixed screen px)
//   bar.update(t)                                          // = bar.set(buildAt(t), t)
//   bar.set(state, t)                                      // state as returned by buildAt (any field overridable)
//   Geometry: panel 216x15 at x 52..268, y 164..179 (top of the screen); slides down from above while docking.
//   BuildBar.Y (164) / BuildBar.H (15) let other UI avoid it (Act II puts subtitles below it while it shows).
import * as THREE from 'three';
import * as T from './timing.js';
import { rect, Quad, canvasTex, pixelCanvas } from '../core/gfx.js';
import { panel } from '../core/ui.js';
import { TextSprite } from '../core/text.js';
import { PAL } from '../core/palette.js';
import { CUE, act2BarPoints } from '../scenes/act2/plan.js';

export const BAR_LABEL = 'REALITY LV1 → LV2';

/** (v4) the builds' fill: 0 -> 98 % in beat steps from t0 to t1 (ease-in, so it accelerates like the riser), then 99 sticks */
const BUILD_FILL1 = 77.757;   // the triplet roll: the bar hits 99 % and sticks (then LOADING in the silence, 100 % at the launch)
const BUILD_FILL2 = 168.075;  // the dense 8ths / montage: 99 % sticks until the Eraser rubs the 99 out (172.80 -> 173.0)
function buildFill(t, t0, t1) {
  const steps = T.beatsIn(t0, t1, 1); let k = 0; for (const e of steps) if (t >= T.snap(e)) k++;
  const u = k / Math.max(1, steps.length); return Math.min(98, Math.floor(98 * (0.3 * u + 0.7 * u * u) + 1e-6));
}
export function buildAt(t) {
  const enter = T.snap(CUE.enter), build = T.snap(CUE.build), launch = T.snap(CUE.launch), silence = T.snap(CUE.silence), impact = T.snap(CUE.impact);
  // (v4) REALITY LV shows ONLY during the build (67.778 -> the impact), where its filling is the riser; it docks on the build
  const visible = t >= build && t < impact;
  let pct = 0;
  if (t >= launch) pct = 100;
  else if (t >= T.snap(BUILD_FILL1)) pct = 99;
  else if (t >= build) pct = buildFill(t, CUE.build, BUILD_FILL1);   // (v4) the bar only lives in the build: it fills there, beat by beat
  else if (t >= enter) pct = Math.min(99, Math.floor(act2BarPoints(t) + 1e-6));
  const done = t >= launch, stuck = t >= T.snap(BUILD_FILL1) && !done;
  const bp = T.beatAt(t + 0.5 / T.fps()); const ph = bp - Math.floor(bp);
  const glitch = stuck && t >= T.snap(BUILD_FILL1) && t < silence && ph >= 0.5 && ph < 0.62 ? 1 + (Math.floor(bp) % 4) : 0;
  const text = t >= silence ? '100% · LOADING…' : pct + '%';
  return { visible, pct, label: BAR_LABEL, text, dock: T.span(t, build, build + 0.3, T.ease.out), stuck, done, glitch };
}

export class BuildBar extends THREE.Group {
  static Y = 164; static H = 15;
  constructor({ x = 52, y = BuildBar.Y, w = 216 } = {}) {
    super();
    this.x0 = x; this.y0 = y; this.w = w;
    this.inner = new THREE.Group(); this.add(this.inner);
    const add = (o, dz) => { o.userData.dz = dz; this.inner.add(o); return o; };
    this.bg = add(panel(w, 15, 'dialog'), 0); this.bg.place(x, y);
    this.title = add(new TextSprite({ text: BAR_LABEL, font: 'fp10', color: PAL.white, shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'bl' }), 0.5);
    this.title.place(x + 5, y + 3);
    this.bx = x + 104; this.bw = w - 104 - 36;
    this.well = add(rect(this.bw + 2, 7, '#05060d'), 0.2); this.well.place(this.bx - 1, y + 4);
    this.fill = add(rect(1, 5, PAL.green), 0.3);
    this.hi = add(rect(1, 1, '#b8ffd0'), 0.4);
    this.ticks = [0.25, 0.5, 0.75].map((k) => { const q = add(rect(1, 5, '#222a52'), 0.35); q.place(this.bx + Math.round(this.bw * k), y + 5); return q; });
    this.spin = add(rect(2, 2, PAL.yellow), 0.6);
    this.pct = add(new TextSprite({ text: '0%', font: 'px', color: PAL.white, shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'br' }), 0.5);
    this.pct.place(x + w - 4, y + 4);
    this.wide = add(new TextSprite({ text: '', font: 'fp10', color: PAL.goldHi, shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'bc' }), 0.55);
  }
  update(t) { return this.set(buildAt(t), t); }
  /** s: buildAt(t) result (or { pct (0..100), text, visible, dock, stuck, done, color }) */
  set(s = {}, t = 0) {
    const { visible = true, pct = 0, dock = 1, stuck = false, done = pct >= 100, color, glitch = 0 } = s;
    this.visible = visible; if (!visible) return this;
    this.inner.position.y = Math.round((1 - dock) * 20) + (glitch ? [0, 1, -1, 0, 1][glitch] : 0);
    this.inner.position.x = glitch ? [0, 2, -2, 1, -1][glitch] : 0;
    const k = pct / 100, n = Math.max(0, Math.min(this.bw, Math.round(this.bw * k)));
    const c = color || (done ? PAL.gold : glitch ? PAL.red : PAL.green);
    this.fill.visible = this.hi.visible = n > 0;
    if (n > 0) { this.fill.setSize(n, 5); this.fill.place(this.bx, this.y0 + 5); this.fill.material.setColor(c); this.hi.setSize(n, 1); this.hi.place(this.bx, this.y0 + 9); }
    const text = glitch ? ['', '9?%', 'ERR', '99.9%', '9_%'][glitch] : (s.text ?? pct + '%');
    const long = text.length > 5;   // '100% · LOADING…' does not fit the % slot: it replaces the label
    this.wide.visible = long; this.title.visible = !long; this.pct.visible = !long;
    if (long) { this.wide.set({ text }); this.wide.place(this.x0 + this.w / 2, this.y0 + 3); }
    else {
      const blink = stuck && Math.floor(t * 4) % 2 === 1;   // the classic hang at 99%
      this.pct.set({ text, color: done ? PAL.goldHi : glitch ? '#ff6a7a' : blink ? '#ff6a7a' : PAL.white });
    }
    // while stuck: the missing 1% blinks at the end of the well
    this.spin.visible = stuck;
    if (stuck) { this.spin.visible = Math.floor(t * 6) % 2 === 0; this.spin.setSize(2, 5); this.spin.place(this.bx + this.bw - 2, this.y0 + 5); }   // the last 1% blinking in the well
    return this;
  }
}

// ============================================================================================ SECOND BAR (additive)
// ACT IV team, 2026-10-16 (coordinator-authorized; Act II's buildAt / BuildBar above are untouched).
// REALITY LV2 → LV3 (docs/game_design_acts3-5.md 149.22-173.02): docks on "That's it" (149.22), creeps with the rebuild
// (fixtures 150.255, functions 151.858), races to 99 on the gang vocal (154.26 → 160.83, one step per 16th, accelerating),
// STICKS at 99 through the final build (glitching on the off-beat 8ths like the first one until the montage), the pink Eraser
// (UNDO, QA now) rubs out the stuck 99 on 一笔一画! (172.80), and it reads 100% gold on Act IV's last frame (173.0, the 173.02
// hit). Act V owns 173.02 → 174.40 (100% · LOADING… in the silence, shatter at 174.40): see CORE_REQUESTS.md R-C4.
//   import { buildAt2, BuildBar2, BAR2 } from '../../show/build_bar.js';
//   const bar = new BuildBar2();   bar.update(t)    (same 320x180 UI geometry as BuildBar)
export const BAR2_LABEL = 'REALITY LV2 → LV3';
export const BAR2 = { dock: 149.22, fix: 150.255, fun: 151.858, race0: 154.26, race1: 160.83, build: 161.728, montage: 168.075, rub: 172.80, done: 173.0, silence: 173.19, shatter: 174.40 };
export function buildAt2(t) {
  const B = BAR2; const visible = t >= T.snap(B.build) && t < T.snap(B.shatter);   // (v4) only during the final build (161.728 ->)
  let pct = 0;
  if (t >= T.snap(B.done)) pct = 100;
  else if (t >= T.snap(BUILD_FILL2)) pct = 99;
  else if (t >= T.snap(B.build)) pct = buildFill(t, B.build, BUILD_FILL2);   // (v4) shown only from the build: it fills here
  else if (t >= T.snap(B.race1)) pct = 99;
  else if (t >= T.snap(B.race0)) {
    const steps = T.beatsIn(B.race0, B.race1, 4); let k = 0; for (const s of steps) if (t >= T.snap(s)) k++;
    const u = k / Math.max(1, steps.length); pct = Math.min(98, 12 + Math.floor(87 * (0.35 * u + 0.65 * u * u)));
  } else if (t >= T.snap(B.fun)) pct = 6 + Math.min(6, Math.floor(T.clamp01((t - B.fun) / 0.5) * 6 + 1e-6));
  else if (t >= T.snap(B.fix)) pct = Math.min(6, Math.floor(T.clamp01((t - B.fix) / 0.5) * 6 + 1e-6));
  const done = pct >= 100, rubbing = t >= T.snap(B.rub) && !done, stuck = pct === 99 && !rubbing;
  const bp = T.beatAt(t + 0.5 / T.fps()); const ph = bp - Math.floor(bp);
  const glitch = stuck && t >= B.build && t < B.montage && ph >= 0.5 && ph < 0.62 ? 1 + (Math.floor(bp) % 4) : 0;
  const rub = rubbing ? T.clamp01((t - B.rub) / (B.done - B.rub)) : 0;
  const text = t >= B.silence ? '100% · LOADING…' : pct + '%';
  return { visible, pct, label: BAR2_LABEL, text, dock: T.span(t, B.build, B.build + 0.3, T.ease.out), stuck, done, glitch, rub, rubbing };
}
/** the second bar: BuildBar with its own label + the pink Eraser rubbing out the stuck 99 */
export class BuildBar2 extends BuildBar {
  constructor(o) {
    super(o);
    this.title.set({ text: BAR2_LABEL });
    // a tiny pixel pink eraser (cap on, smiling): 11 x 9
    const cv = pixelCanvas(11, 9, (g, px) => {
      px(1, 2, '#1b1b22', 9, 7); px(2, 3, '#f2788f', 7, 5); px(2, 3, '#f7a1b0', 7, 1); px(2, 6, '#e9dfca', 7, 1);   // body, top light, sleeve
      px(4, 4, '#1b1b22'); px(6, 4, '#1b1b22'); px(5, 5, '#7a1630');                                                 // eyes, smile
      px(3, 0, '#cdae74', 4, 2); px(7, 1, '#a88a54', 2, 1); });                                                      // Charlie's cap
    this.rubber = new Quad(canvasTex(cv), 11, 9);
    this.rubber.userData.dz = 0.8; this.rubber.visible = false; this.inner.add(this.rubber);
    this.crumbs = [0, 1, 2, 3, 4].map(() => { const c = rect(1, 1, '#f2788f'); c.userData.dz = 0.7; c.visible = false; this.inner.add(c); return c; });
  }
  update(t) { return this.set(buildAt2(t), t); }
  set(s = {}, t = 0) {
    const rub = s.rub || 0;
    // while rubbing: the digits go one by one ('99%' -> '9%' -> '%'), then the % slot waits for the 100
    const st = s.rubbing ? { ...s, text: rub < 0.3 ? '99%' : rub < 0.6 ? '9%' : '%', stuck: false } : s;
    super.set(st, t);
    if (this.rubber) {
      this.rubber.visible = !!s.rubbing && s.visible !== false;
      for (const c of this.crumbs) c.visible = false;
      if (this.rubber.visible) {
        const x1 = this.x0 + this.w - 4; const sweep = Math.sin(rub * Math.PI * 6);   // three scrubs across the digits
        this.rubber.place(x1 - 20 + 8 * sweep, this.y0 + 3 + Math.abs(sweep) * 2);
        this.crumbs.forEach((c, i) => { const a = rub * 2.2 - i * 0.2; if (a <= 0 || a > 1) return; c.visible = true;
          c.place(Math.round(x1 - 16 + i * 3 + 2 * Math.sin(i * 7)), Math.round(this.y0 + 2 - a * 12)); });
      }
    }
    return this;
  }
}
