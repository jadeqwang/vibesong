// ACT I poses that the art dept is drawing now (engine/ART_REQUESTS.md A-2). Each pose is looked up BY NAME in the live
// sprite library first (sprites.json), so the art drops in with no code change; until then a stand-in is composed in
// code from the existing strips (src/scenes/mocks/a_art.js, the approved keyframe mocks).
// Uniform pose record: { tex, w, h, n, anchor: [ax, ay] (canvas coords, top-left origin), fps, art: bool }.
// Jade canon is enforced here too (these bypass Actor): every Jade pose below has the pencils IN HER HANDS and the hair
// DOWN, except jade_twin_draw, which IS the transition (bun -> hair falling -> hair down, pencils drawn like swords).
import { canvasTex, pixelCanvas, Quad } from '../../core/gfx.js';
import { PAL, hexToRgb } from '../../core/palette.js';
import * as A from '../mocks/a_art.js';

const strip = (cvs) => { const w = cvs[0].width, h = cvs[0].height; return pixelCanvas(w * cvs.length, h, (g) => cvs.forEach((c, i) => g.drawImage(c, i * w, 0))); };
const fromCanvases = (cvs, anchor, fps = 8) => ({ tex: canvasTex(strip(cvs)), w: cvs[0].width, h: cvs[0].height, n: cvs.length, anchor, fps, art: false });
const fromLib = (lib, name) => { const s = lib.get(name); return { tex: s.tex, w: s.w, h: s.h, n: s.n, anchor: s.meta.anchor, fps: s.meta.fps, art: true }; };
/** rotate every canvas about a pivot; the pivot becomes the anchor (canvas centre) */
const rotAll = (cvs, deg, pivot) => { const r = cvs.map((c) => A.rotCanvas(c, deg, pivot)); const S = Math.max(...r.map((x) => x.cv.width)); return { cvs: r.map((x) => x.cv), anchor: [r[0].px, r[0].py], S }; };

/** progressive rainbow smudge on an eraser frame (level 1..4): it rubbed colour and it won't come off */
export function smearCanvas(cv, level) {
  const out = pixelCanvas(cv.width, cv.height, (g) => g.drawImage(cv, 0, 0)); if (level <= 0) return out;
  const g = out.getContext('2d'); const im = g.getImageData(0, 0, out.width, out.height), d = im.data;
  const W = out.width, cx = W / 2, top = out.height * 0.55;
  for (let y = 0; y < out.height; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4; if (d[i + 3] < 128) continue;
    const l = d[i] + d[i + 1] + d[i + 2]; if (l < 90) continue;                         // keep outline + pupils
    const u = (x - cx * 0.9) * 0.55 + (top + 40 - y) * 0.9;
    const band = Math.floor(u / 3); if (u < 10 || u > 10 + 3 * (2 + level * 2)) continue;
    if (((x * 7 + y * 3) % (9 + level)) === 0) continue;
    const [r, gg, b] = hexToRgb(PAL.rainbow[((band * 2) % 12 + 12) % 12]);
    d[i] = (r * 0.8 + d[i] * 0.2) | 0; d[i + 1] = (gg * 0.8 + d[i + 1] * 0.2) | 0; d[i + 2] = (b * 0.8 + d[i + 2] * 0.2) | 0;
  }
  g.putImageData(im, 0, 0); return out;
}

export function buildPoses(lib) {
  const has = (n) => lib.has(n);
  const P = {};
  // ---------------------------------------------------------------- Jade
  P.jade_twin_draw = has('jade_twin_draw') ? fromLib(lib, 'jade_twin_draw')
    : fromCanvases([0, 1, 2].map((f) => A.frameCanvas(lib, 'jade_bun_pull', f)), [18, 43], 16);   // bun -> hair falling -> hair down, twin pencils
  P.jade_erase = has('jade_erase') ? fromLib(lib, 'jade_erase') : fromCanvases([0, 1, 2].map((f) => {
    // jade_draw_graphite with the line removed; the graphite pencil FLIPPED (pink cap on the wall, to her right) + crumbs
    const base = A.jadeEmptyHand(lib); const p = A.tinyPencil('graphite', 15);
    return pixelCanvas(base.width, base.height, (g, px) => {
      g.drawImage(base, 0, 0); g.drawImage(p, 40 + [0, 2, 1][f], 21 + [0, -1, 1][f]);
      for (let i = 0; i < 5; i++) px(54 + ((i * 3 + f * 2) % 7), 18 + ((i * 5 + f) % 14), i % 2 ? PAL.capPink : '#ffc0a0', 1 + (i % 2), 1 + (i % 2));
    });
  }), [36, 43], 12);
  const dangle = (who) => { const nm = who + '_dangle'; if (has(nm)) return fromLib(lib, nm); return fromCanvases([0, 1].map((f) => A.cropTop(A.frameCanvas(lib, who + '_hang', f), 3)), [18, 1], 4); };
  P.jade_dangle = dangle('jade'); P.ricky_dangle = dangle('ricky'); P.charlie_dangle = dangle('charlie');
  // the free hand (canvas coords) the next hero in a human chain hangs from (art: Jade's pencil hand is down-LEFT)
  P.jade_dangle.free = P.jade_dangle.art ? [10, 29] : [21, 41];
  P.ricky_dangle.free = P.ricky_dangle.art ? [29, 25] : [21, 41];
  P.charlie_dangle.free = P.charlie_dangle.art ? [21, 41] : [21, 41];
  // ---------------------------------------------------------------- Ricky hanging from his strap, sustaining, neck UP
  P.ricky_dangle_play = has('ricky_dangle_play') ? fromLib(lib, 'ricky_dangle_play')
    : (() => { const r = rotAll([0, 1].map((f) => A.frameCanvas(lib, 'ricky_sustain', f)), 14, [20, 6]); return fromCanvases(r.cvs, r.anchor, 4); })();
  // ---------------------------------------------------------------- Charlie under a big hat canopy, boots out (anchor = boots)
  P.charlie_parachute_carry = has('charlie_parachute_carry') ? fromLib(lib, 'charlie_parachute_carry')
    : fromCanvases([0, 1, 2].map((f) => A.frameCanvas(lib, 'charlie_hat_parachute', f)), [18, 47], 6);
  { const pc = P.charlie_parachute_carry; const m = pc.art ? lib.get('charlie_parachute_carry').meta : null;
    const b = m?.boots?.[0]; // per-frame [[lx,ly],[rx,ry]]; same on every frame in the current art
    pc.bootOff = b ? b.map(([x, y]) => [x - pc.anchor[0], pc.anchor[1] - y]) : [[-8, 1], [8, 1]]; }
  // ---------------------------------------------------------------- the Eraser (x2, 132x124, feet anchor [66,123])
  const ch = [0, 1, 2].map((f) => A.frameCanvas(lib, 'eraser_chase_x2', f)); const FEET = [66, 123];
  P.eraser_chase = fromLib(lib, 'eraser_chase_x2');
  P.eraser_blink = has('eraser_blink_x2') ? fromLib(lib, 'eraser_blink_x2') : fromCanvases([A.eraserBlink(lib), A.eraserBlink(lib)], FEET, 4);
  P.eraser_skid = has('eraser_skid_x2') ? fromLib(lib, 'eraser_skid_x2') : (() => { const r = rotAll(ch, 9, FEET); return fromCanvases(r.cvs, r.anchor, 12); })();
  P.eraser_peer = has('eraser_peer_x2') ? fromLib(lib, 'eraser_peer_x2') : (() => { const r = rotAll([ch[1], ch[1]], -10, [110, 123]); return fromCanvases(r.cvs, r.anchor, 2); })();
  P.eraser_leap = (() => { const r = rotAll(ch, -12, FEET); return fromCanvases(r.cvs, r.anchor, 12); })();
  // smear: the art dept's overlay (4 levels) or stand-ins with the smudge baked into the skid / peer / leap frames
  P.smearArt = has('eraser_smear_x2') ? fromLib(lib, 'eraser_smear_x2') : null;
  if (P.smearArt) P.smearArt.skidOffset = lib.get('eraser_smear_x2').meta.skid_offset || null;
  if (!P.smearArt) for (const k of ['eraser_skid', 'eraser_peer', 'eraser_leap', 'eraser_chase']) {
    const base = k === 'eraser_chase' ? ch : null;
    P[k + '_smear'] = [1, 2, 3, 4].map((lv) => {
      if (base) return fromCanvases(base.map((c) => smearCanvas(c, lv)), FEET, 6);
      const src = P[k]; const img = src.tex.image; const cvs = [...Array(src.n)].map((_, f) => pixelCanvas(src.w, src.h, (g) => g.drawImage(img, f * src.w, 0, src.w, src.h, 0, 0, src.w, src.h)));
      return fromCanvases(cvs.map((c) => smearCanvas(c, lv)), src.anchor, src.fps);
    });
  }
  return P;
}

/** a Quad that shows one frame of a pose record, feet/hand anchor at (x, y) */
export class PoseQuad extends Quad {
  constructor() { super(null, 1, 1); this.cur = null; }
  show(pose, frame, x, y, { flip = false, sil = null } = {}) {
    if (!pose) { this.visible = false; return this; }
    this.visible = true;
    if (this.cur !== pose) { this.material.setMap(pose.tex); this.cur = pose; }
    const f = ((Math.floor(frame) % pose.n) + pose.n) % pose.n;
    this.setRect(f / pose.n, 0, 1 / pose.n, 1);
    this.w = pose.w; this.h = pose.h; this.anchor = [pose.anchor[0], pose.h - 1 - pose.anchor[1]];
    this.setFlip(flip);
    if (sil) this.material.uniforms.sil.value.set(...sil); else this.material.uniforms.sil.value.set(0, 0, 0, 0);
    this.place(x, y); return this;
  }
}

/** rotated hanging-hero frames for the human chain (cached by hero/frame/angle); grip = the anchor */
export function rotCache() {
  const cache = new Map();
  const rimOf = (rec) => { if (!rec.rim) { const cv = A.rimSilhouette(rec.tex.image); rec.rim = { ...rec, tex: canvasTex(cv), w: cv.width, h: cv.height, anchor: [rec.anchor[0] + 1, rec.anchor[1] + 1] }; } return rec.rim; };
  const get = (pose, frame, deg, { rim = false } = {}) => { const r = getRaw(pose, frame, deg); return rim ? rimOf(r) : r; };
  get.rim = rimOf;
  const getRaw = (pose, frame, deg) => {
    const a = Math.round(deg / 3) * 3; const key = pose.tex.uuid + ':' + frame + ':' + a + ':' + (pose.free || ''); if (cache.has(key)) return cache.get(key);
    const img = pose.tex.image; const f = ((frame % pose.n) + pose.n) % pose.n;
    const cv = pixelCanvas(pose.w, pose.h, (g) => g.drawImage(img, f * pose.w, 0, pose.w, pose.h, 0, 0, pose.w, pose.h));
    const r = A.rotCanvas(cv, a, pose.anchor);
    // where the bottom-centre "free hand / feet" lands after rotation (next link hangs from it)
    const fp = pose.free || [pose.anchor[0] + 3, pose.h - 3]; const foot = A.rotPoint(fp, a, pose.anchor, r.px);
    const rec = { tex: canvasTex(r.cv), w: r.cv.width, h: r.cv.height, n: 1, anchor: [r.px, r.py], foot: [foot[0] - r.px, -(foot[1] - r.py)] };
    cache.set(key, rec); return rec;
  };
  return get;
}
