// MOCKS B: the REALITY build bar (docked at the top of the screen from 52.6 s), UI layer, 320x180 screen px.
//   const bar = st.addUI(new BuildBar(), ZUI.BANNER); bar.set({ pct: 0.55 })  or  bar.set({ pct: 0.99, label: '99%' })
import * as THREE from 'three';
import { rect } from '../../core/gfx.js';
import { panel } from '../../core/ui.js';
import { TextSprite } from '../../core/text.js';
import { PAL } from '../../core/palette.js';

export class BuildBar extends THREE.Group {
  constructor({ x = 52, y = 164, w = 216 } = {}) {
    super();
    this.x0 = x; this.y0 = y; this.w = w;
    this.bg = panel(w, 15, 'dialog'); this.bg.place(x, y); this.add(this.bg);
    this.title = new TextSprite({ text: 'REALITY LV1 → LV2', font: 'fp10', color: PAL.white, shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'bl' });
    this.title.place(x + 5, y + 3); this.title.userData.dz = 0.5; this.add(this.title);
    this.bx = x + 104; this.bw = w - 104 - 34;
    this.well = rect(this.bw + 2, 7, '#05060d'); this.well.place(this.bx - 1, y + 4); this.well.userData.dz = 0.2; this.add(this.well);
    this.fill = rect(1, 5, PAL.green); this.fill.userData.dz = 0.3; this.add(this.fill);
    this.hi = rect(1, 1, '#b8ffd0'); this.hi.userData.dz = 0.4; this.add(this.hi);
    this.ticks = [0.25, 0.5, 0.75].map((k) => { const q = rect(1, 5, '#222a52'); q.place(this.bx + Math.round(this.bw * k), y + 5); q.userData.dz = 0.35; this.add(q); return q; });
    this.pct = new TextSprite({ text: '0%', font: 'px', color: PAL.white, shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'br' });
    this.pct.place(x + w - 4, y + 4); this.pct.userData.dz = 0.5; this.add(this.pct);
  }
  /** s: { pct 0..1, label (override text), color } */
  set({ pct = 0, label, color } = {}) {
    const n = Math.max(0, Math.min(this.bw, Math.round(this.bw * pct)));
    const c = color || (pct >= 1 ? PAL.gold : PAL.green);
    this.fill.visible = this.hi.visible = n > 0;
    if (n > 0) { this.fill.setSize(n, 5); this.fill.place(this.bx, this.y0 + 5); this.fill.material.setColor(c); this.hi.setSize(n, 1); this.hi.place(this.bx, this.y0 + 9); }
    this.pct.set({ text: label || Math.round(pct * 100) + '%', color: pct >= 1 ? PAL.goldHi : PAL.white });
    return this;
  }
}
