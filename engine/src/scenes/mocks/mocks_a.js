// MOCKS · Team A keyframes 14-34.69 (docs/game_design_acts1-3.md, beats 16.73-34.69). NOT part of the cut.
// Static tableaux: update(t) picks the latest keyframe at or before t and shows that composition (no in-betweens).
// Each keyframe lives in its own strip of the world (x offset OX = k * 1000) on the CARTRIDGE paper/graphite look;
// the HUD, subtitles and LINES OF CODE run on the real song time, exactly like act1/kaizo.js.
//
//   A1 16.95 THE CLUE        A2 17.45 RUN (NOT VERY EFFECTIVE)   A3 19.7 BECAUSE (trampoline catch)
//   A4 23.9  LINKED FREEZE   A5 25.0  PARACHUTE                  A6 26.6 SURGE (hat shield)
//   A7 29.5  COLOR STOPS IT  A8 33.3  DRAW AHEAD                 A9 34.5 EDGE
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { locAt } from '../../show/loc.js';
import { Stage2D, Z, ZUI } from '../../core/stage2d.js';
import { PAL } from '../../core/palette.js';
import { PaperBG, BlueprintBG, Batch, CheckerRect } from '../../core/fx.js';
import { Actor } from '../../core/sprites.js';
import { TextSprite, blockText } from '../../core/text.js';
import { Quad, canvasTex, rect, pixelCanvas } from '../../core/gfx.js';
import { HUD, HUD_H, Subtitle, subtitleFor, Banner, panel } from '../../core/ui.js';
import { Hanzi2D } from '../../core/hanzi2d.js';
import { bangCanvas, checkerCanvas } from '../../core/props.js';
import { act1Atlas, floorColumn } from '../act1/common.js';
import * as KA from '../act1/kaizo_art.js';
import * as A from './a_art.js';
import { mulberry32 } from '../../util.js';

const KF = [
  { id: 'A1', t: 16.95 }, { id: 'A2', t: 17.45 }, { id: 'A3', t: 19.7 }, { id: 'A4', t: 23.9 }, { id: 'A5', t: 25.0 },
  { id: 'A6', t: 26.6 }, { id: 'A7', t: 29.5 }, { id: 'A8', t: 33.3 }, { id: 'A9', t: 34.5 },
];

export async function setup(ctx) {
  const lib = ctx.lib;
  const st = new Stage2D(ctx, { bg: PAL.paper });
  const paper = st.add(new PaperBG(), Z.BG);
  const blue = st.add(new BlueprintBG(), Z.BG + 1);
  const atlas = act1Atlas(lib);
  for (const F of [60, 72, 104]) for (let v = 0; v < 3; v++) atlas.add(`fl${F}_${v}`, floorColumn(F, v), [0, 0]);
  PAL.rainbow.forEach((h, i) => atlas.add('cap' + i, KA.colorCap(h), [0, 0]));
  for (let i = 0; i < 7; i++) atlas.add('bf' + i, A.bigFlower(i), [4, 14]);
  atlas.add('lkH', A.linkCanvas('#7a3cff', '#c2a0ff', false), [3, 2]); atlas.add('lkV', A.linkCanvas('#7a3cff', '#c2a0ff', true), [2, 3]);
  atlas.add('chk16', checkerCanvas(4), [0, 0]);
  const hillsTex = canvasTex(KA.hillsCanvas()), ruinsTex = canvasTex(KA.ruinsCanvas());
  const bangTex = canvasTex(bangCanvas()), sweatTex = canvasTex(A.sweatDrop());

  const K = KF.map((k, i) => ({ ...k, ox: i * 1000, blankX: null, missing: 0, voidX: null, active: null, slot: null, hairUp: false }));
  const kf = Object.fromEntries(K.map((k) => [k.id, k]));

  // ---------------------------------------------------------------- tiny scene-building kit (screen coords + OX)
  let OX = 0;
  const batches = (clip = null) => {
    const bg = st.add(new Batch(atlas, 800), Z.PLATFORM), fx = st.add(new Batch(atlas, 800), Z.FX), fl = st.add(new Batch(atlas, 300), Z.PROP + 2);
    for (const b of [bg, fx, fl]) b.begin();
    if (clip !== null) for (const b of [bg, fx]) b.material.uniforms.clipX.value = OX + clip;   // flowers (colour) never clipped
    return { bg, fx, fl, end() { bg.end(); fx.end(); fl.end(); } };
  };
  const floor = (b, x0, x1, F = 60) => { for (let x = Math.floor(x0 / 16) * 16; x < x1; x += 16) b.bg.draw(`fl${F}_${((x / 16) % 3 + 3) % 3}`, OX + x, 0); };
  /** quad from a canvas; (ax, ay) = anchor pixel in canvas coords (top-left origin), placed so that pixel sits at (x, y) */
  const spr = (cv, ax, ay, z, x, y, o = {}) => { const q = st.add(new Quad(o.tex || canvasTex(cv), cv.width, cv.height, { anchor: [ax, cv.height - 1 - ay] }), z); q.place(OX + x, y); if (o.clip !== undefined) q.material.uniforms.clipX.value = OX + o.clip; if (o.sil) q.material.uniforms.sil.value.set(...o.sil); return q; };
  const hero = (name, s, z = Z.ACTOR) => { const a = st.add(new Actor(lib, name, { name }), z); a.set({ facing: 1, pencil: name === 'jade', ...s, x: OX + s.x }); return a; };
  /** rotated canvas, pivot (canvas coords) pinned to world (x, y); returns the quad and a mapper canvas point -> world */
  const rot = (cv, deg, pivot, z, x, y, o = {}) => {
    const r = A.rotCanvas(cv, deg, pivot); const q = spr(r.cv, r.px, r.py, z, x, y, o);
    const R = r.px; return { q, at: (p) => { const [rx, ry] = A.rotPoint(p, deg, pivot, R); return [x + (rx - R), y - (ry - R)]; } };
  };
  const pop = (text, x, y, { color = PAL.white, outline = PAL.ink, font = 'px', z = Z.TEXT, scale = 1, anchor = 'c' } = {}) => {
    const s = st.add(new TextSprite({ text, font, color, outline, outline8: true }, { anchor }), z); s.setScale(scale); s.place(OX + x, y); return s;
  };
  const bang = (x, y) => spr(bangCanvas(), 4, 13, Z.TEXT, x, y, { tex: bangTex });
  const sweat = (x, y) => spr(A.sweatDrop(), 2, 6, Z.TEXT, x, y, { tex: sweatTex });
  const parallax = (clip = null, voidX = null, F = 60) => {
    const h = st.add(new Quad(hillsTex, 512, 70), Z.PARALLAX); h.place(OX - 60, F + 10);
    const r = st.add(new Quad(ruinsTex, 640, 96), Z.PARALLAX + 1); r.place(OX - 140, F - 2);
    for (const q of [h, r]) { if (clip !== null) q.material.uniforms.clipX.value = OX + clip; if (voidX !== null) q.material.uniforms.clipR.value = OX + voidX; }
  };
  const ER = { w: 132, h: 124, ax: 66, ay: 123 };      // eraser_chase_x2 frame geometry (feet anchor)
  const eraserQ = (cv, x, y, z = Z.PROP + 5, deg = 0, pivot = [ER.ax, ER.ay]) => deg ? rot(cv, deg, pivot, z, x, y).q : spr(cv, ER.ax, ER.ay, z, x, y);
  const LYRIC = 'Everything I love about life just blossoms';
  const hangCv = (who, f = 0) => A.cropTop(A.frameCanvas(lib, who + '_hang', f), 3);   // grab bar removed; grip ~ (18, 1)
  const crumbs = (b, n, x0, x1, y0, y1, seed) => { const r = mulberry32(seed); for (let i = 0; i < n; i++) b.fl.draw('ecrumb' + Math.floor(r() * 4), OX + x0 + r() * (x1 - x0), y0 + r() * (y1 - y0)); };

  // ================================================================ A1 · 16.95 · THE CLUE
  {
    const k = kf.A1; OX = k.ox; k.blankX = 165; k.hairUp = true;
    parallax(k.blankX);
    st.add(new Quad(canvasTex(A.rubStreaks(170, 110)), 170, 110), Z.BG2).place(OX - 4, 38);
    const b = batches(k.blankX);
    floor(b, 160, 336);
    const L0 = 300 - LYRIC.length * 9, JX = 282;
    Array.from(LYRIC).forEach((ch, i) => {
      const x = L0 + i * 9, on = x + 4 < JX; const hue = PAL.rainbow[(i * 5) % 12];
      const q = st.add(new Quad(canvasTex(KA.letterTile(ch, on, hue)), 9, 10), Z.PLATFORM + 2); q.place(OX + x, 50); q.material.uniforms.clipX.value = OX + k.blankX;
      if (on && ch !== ' ' && i % 2 === 0) b.fl.draw('bf' + ((i / 2) % 7), OX + x + 4, 60);   // the flowers: NOT clipped (colour stays)
    });
    // sparkle on the floating flowers so the clue reads
    for (let i = 0; i < 6; i++) b.fl.draw(i % 2 ? 'spark' : 'px2', OX + 70 + i * 17 + (i % 3) * 3, 80 + (i % 3) * 5, { solid: PAL.gold });
    crumbs(b, 3, 70, 120, 36, 44, 11);
    b.end();
    eraserQ(A.frameCanvas(lib, 'eraser_chase_x2', 0), 6, 38);
    hero('ricky', { x: 192, y: 60, anim: 'idle', frame: 0, facing: -1 }, Z.ACTOR);
    hero('charlie', { x: 236, y: 63, anim: 'jump', frame: 0 }, Z.ACTOR + 1);
    hero('jade', { x: JX, y: 60, anim: 'run', frame: 2, pencil: false }, Z.ACTOR + 2);   // bun still up: the pencils come out at 17.38
    bang(192, 108); bang(236, 111); bang(284, 108);
  }
  // ================================================================ A2 · 17.45 · RUN: twin pencils, NOT VERY EFFECTIVE
  {
    const k = kf.A2; OX = k.ox; k.blankX = 128; k.active = 'ricky'; k.slot = 'ricky0';
    parallax(k.blankX);
    st.add(new Quad(canvasTex(A.rubStreaks(150, 110, 5)), 150, 110), Z.BG2).place(OX - 4, 38);
    const b = batches(k.blankX);
    floor(b, 120, 336);
    const L0 = 330 - LYRIC.length * 9;
    Array.from(LYRIC).forEach((ch, i) => {
      const x = L0 + i * 9, on = x < 270; const hue = PAL.rainbow[(i * 5) % 12];
      const q = st.add(new Quad(canvasTex(KA.letterTile(ch, on, hue)), 9, 10), Z.PLATFORM + 2); q.place(OX + x, 50); q.material.uniforms.clipX.value = OX + k.blankX;
      if (on && ch !== ' ' && i % 2 === 0) b.fl.draw('bf' + ((i / 2) % 7), OX + x + 4, 60);
    });
    // chord impact on the Eraser's face: a few sparks, it does nothing
    for (let i = 0; i < 7; i++) { const a = i * 0.9; b.fl.draw(i % 2 ? 'spark' : 'px2', OX + 74 + Math.cos(a) * 9, 88 + Math.sin(a) * 9, { solid: PAL.yellow }); }
    b.fx.draw('puff3', OX + 76, 88); crumbs(b, 2, 84, 120, 36, 42, 21);
    b.end();
    eraserQ(A.eraserBlink(lib), 8, 26);
    pop('*blink*', 46, 112, { color: PAL.g0, outline: PAL.white, font: 'sk' });
    // Pokemon-style battle text
    const box = st.add(panel(184, 20, 'dialog'), Z.TEXT); box.place(OX + 2, 124);
    pop('NOT VERY EFFECTIVE...', 94, 134, { color: PAL.white, outline: null, z: Z.TEXT + 1 });
    hero('ricky', { x: 152, y: 60, anim: 'chord', frame: 1, facing: -1 }, Z.ACTOR);
    hero('charlie', { x: 210, y: 60, anim: 'run', frame: 3 }, Z.ACTOR + 1);
    hero('jade', { x: 268, y: 60, anim: 'drum', frame: 1, facing: -1 }, Z.ACTOR + 2);   // twin pencils drawn like swords; hair down
    pop('SHING!', 268, 116, { color: PAL.yellow, font: 'sk' });
  }
  // ================================================================ A3 · 19.7 · BECAUSE: the hat-trampoline catch
  {
    const k = kf.A3; OX = k.ox; k.blankX = 26; k.active = 'charlie'; k.slot = 'charlie0';
    const F = 104, LEDGE = 252;
    parallax(k.blankX, null, 72);
    const b = batches();
    floor(b, LEDGE, 336, F);
    // the graphite "because" bridge, chewed from the left: each letter has dropped a little more than the next
    const bt = blockText('because', { cell: 4 }); const L5 = bt.letters[5]; const BX0 = 206 - (L5.x0 + L5.w);
    const drop = [40, 30, 18, 9, 4, 1, 52], rotd = [-30, -22, 12, -6, 3, -1, 34], dx = [0, 0, 0, 0, 0, 0, -6];
    bt.letters.forEach((Lt, i) => {
      const cv = Lt.draw(); const cx = BX0 + Lt.x0 + Lt.w / 2 + dx[i], cy = F - bt.h / 2 - drop[i];
      rot(cv, rotd[i], [cv.width / 2, cv.height / 2], Z.PLATFORM + 1, cx, cy, { clip: k.blankX });
      if (drop[i] > 3) for (let j = 0; j < 3; j++) b.fx.draw('crumb' + (j % 3), OX + cx - 8 + j * 7, cy - 20 - j * 4);
    });
    spr(A.motionLines(3, 10, 8), 0, 0, Z.FX, 210, 84);          // the last 'e' dropping away
    // the gap: Charlie's hat flipped down as a trampoline; Ricky bounces off it back up to the ledge
    spr(A.frameCanvas(lib, 'charlie_prop_trampoline', 1), 29, 29, Z.ACTOR + 3, 230, 40);
    rot(A.frameCanvas(lib, 'ricky_jump', 0), 10, [18, 43], Z.ACTOR + 2, 231, 50);
    spr(A.arcDots(26, 14, 20), 0, 14 + 20, Z.FX, 240, 98);
    pop('BOING!', 186, 64, { color: PAL.yellow, font: 'px' });
    b.fx.draw('puff2', OX + 206, 46); b.fx.draw('puff2', OX + 256, 46);
    b.end();
    eraserQ(A.frameCanvas(lib, 'eraser_chase_x2', 1), -30, 40);
    hero('charlie', { x: 268, y: F, anim: 'throw', frame: 1, facing: -1 }, Z.ACTOR + 1);
    hero('jade', { x: 302, y: F, anim: 'run', frame: 0 }, Z.ACTOR + 1);
  }
  // ================================================================ A4 · 23.9 · LINKED FREEZE (stop 23.70-24.20)
  {
    const k = kf.A4; OX = k.ox; k.active = 'charlie'; k.slot = 'charlie0'; k.dim = true;
    const F = 60;
    parallax(null, null, F);
    const b = batches();
    floor(b, -16, 40, F); floor(b, 272, 336, F);
    spr(KA.pillarCanvas(80), 8, 79, Z.PROP, 8, F);
    // the 丨 post Jade drew on the far cliff
    const post = await Hanzi2D.create('丨', { size: 96, bold: 3 }); post.place(0, 0); const pb = post.strokeBox(0);
    post.place(OX + 292 - (pb.x0 + pb.x1) / 2, F - pb.y0); st.add(post.group, Z.PROP + 8);
    const postTop = F + (pb.y1 - pb.y0) - 4;
    // the visited-purple `linked` chain latched to the post
    const A0 = [16, 146], A1 = [292, Math.min(146, postTop)], sag = 8;
    const cy = (x) => A0[1] + (A1[1] - A0[1]) * ((x - A0[0]) / (A1[0] - A0[0])) - sag * Math.sin(Math.PI * (x - A0[0]) / (A1[0] - A0[0]));
    const chain = st.add(new Batch(atlas, 200), Z.PROP + 9); chain.begin();
    for (let x = A0[0]; x <= A1[0]; x += 5) chain.draw(Math.round((x - A0[0]) / 5) % 2 ? 'lkV' : 'lkH', OX + x, cy(x));
    chain.end();
    const lbl = pop('linked', 236, cy(236) - 18, { color: '#7a3cff', outline: PAL.white, font: 'fp12', anchor: 'bc', z: Z.PROP + 9 });
    const ul = st.add(rect(lbl.w, 1, '#7a3cff'), Z.PROP + 9); ul.place(OX + 236 - Math.floor(lbl.w / 2), cy(236) - 19);
    // the life sign, lit, behind the human chain; everything else dimmed (freeze)
    st.add(new Quad(canvasTex(A.lifeSignBacklit(226, 104)), 226, 60), Z.PROP + 7).place(OX + 44, 62);
    k.dimRect = st.add(rect(1, 1, '#14141a', 0.66), Z.PROP + 6);
    // human chain: Charlie hangs from his hat hooked on the chain, Jade holds his hand, Ricky holds hers. Mid-swing.
    const HX = 78, hook = [HX, cy(HX)];
    const RS = (cv) => A.rimSilhouette(cv);           // silhouette + 1 px rim light, grip shifts by the 1 px border
    spr(RS(A.frameCanvas(lib, 'charlie_hat_boomerang', 0)), 9, 16, Z.ACTOR + 4, hook[0], hook[1] - 6);
    const c1 = rot(RS(hangCv('charlie', 0)), 26, [19, 2], Z.ACTOR + 3, hook[0], hook[1] - 7);
    const cFoot = c1.at([21, 41]);                                  // Jade grabs his hand, down by his boots
    const j1 = rot(RS(hangCv('jade', 1)), 36, [19, 2], Z.ACTOR + 2, cFoot[0], cFoot[1] + 2);
    const jFoot = j1.at([21, 41]);
    const r1 = rot(RS(hangCv('ricky', 0)), 46, [19, 2], Z.ACTOR + 1, jFoot[0], jFoot[1] + 2);
    void r1;
    b.end(); b.fx.renderOrder = Z.ACTOR + 5;
    k.subFrozen = true;
  }
  // ================================================================ A5 · 25.0 · PARACHUTE onto "life"; the Eraser takes the post
  {
    const k = kf.A5; OX = k.ox; k.blankX = 40; k.active = 'charlie'; k.slot = 'charlie0';
    const F = 72;
    parallax(k.blankX, null, 60);
    const b = batches();
    floor(b, 40, 100, F);
    // the post, half rubbed out (graphite = a draft), crumbs
    const post = await Hanzi2D.create('丨', { size: 72, bold: 5 }); post.place(0, 0); const pb = post.strokeBox(0);
    post.place(OX + 80 - (pb.x0 + pb.x1) / 2, F - pb.y0); st.add(post.group, Z.PROP + 6); post.eraseLeftOf(OX + 79); post.u.uErase.value = 0.2;
    const postTop = F + (pb.y1 - pb.y0) - 3;
    crumbs(b, 3, 66, 90, F + 4, F + 30, 51);
    // the chain drops into the pit (its graphite anchor is gone)
    const chain = st.add(new Batch(atlas, 200), Z.PROP + 4); chain.begin();
    for (let i = 0; i < 26; i++) { const u = i / 25; const x = 88 + 26 * u + 5 * Math.sin(u * 6), y = postTop - 4 - 96 * u; if (i % 6 === 5) continue; chain.draw(i % 2 ? 'lkV' : 'lkH', OX + x, y); }
    chain.end();
    spr(A.motionLines(3, 12, 7, '#7a3cff'), 0, 0, Z.FX, 124, 100);
    // the landing platform: the word "life"
    const bt = blockText('life', { cell: 4, face: '#fff6d0', hi: '#ffffff', lo: '#d9b24a', edge: '#3a2f10' });
    st.add(new Quad(canvasTex(bt.canvas), bt.w, bt.h), Z.PLATFORM + 2).place(OX + 176, 64 - bt.h);
    // Charlie under the hat-parachute; Jade and Ricky dangle from his boots, holding hands (a chain)
    hero('charlie', { x: 230, y: 103, anim: 'parachute', frame: 0 }, Z.ACTOR + 2);
    const jr = rot(hangCv('jade', 0), -22, [18, 1], Z.ACTOR + 1, 221, 105);
    const rr = rot(hangCv('ricky', 1), 22, [18, 1], Z.ACTOR, 241, 104);
    void jr; void rr;
    spr(A.motionLines(2, 10, 8), 0, 0, Z.FX, 202, 140); spr(A.motionLines(2, 10, 8), 0, 0, Z.FX, 252, 140);
    b.end();
    eraserQ(A.frameCanvas(lib, 'eraser_chase_x2', 2), 8, F);
  }
  // ================================================================ A6 · 26.6 · THE ERASER SURGES: hat shield
  {
    const k = kf.A6; OX = k.ox; k.blankX = 128; k.active = 'charlie'; k.slot = 'charlie0';
    parallax(k.blankX);
    const b = batches(k.blankX);
    floor(b, 112, 336);
    b.end();
    const fx = st.add(new Batch(atlas, 400), Z.FX); fx.begin();
    // crumb spray from the Eraser's mouth arcing over the party; bouncing off the hat
    const r = mulberry32(61);
    [[112, 100], [124, 116], [138, 126], [152, 132], [118, 92], [132, 112]].forEach(([x, y], i) => fx.draw('ecrumb' + (i % 4), OX + x, y));   // the spray
    [[206, 128], [222, 120], [236, 106]].forEach(([x, y], i) => fx.draw('ecrumb' + ((i + 2) % 4), OX + x, y));                            // ricochets
    for (let i = 0; i < 22; i++) { const u = r(); fx.draw('crumb' + (i % 3), OX + 110 + u * 70, 96 + 40 * Math.sin(Math.PI * u) + (r() - 0.5) * 10); }
    for (let i = 0; i < 6; i++) fx.draw('spark', OX + 152 + i * 8, 124 - Math.abs(i - 2.5) * 2, { solid: PAL.yellow });
    fx.end();
    eraserQ(A.frameCanvas(lib, 'eraser_chase_x2', 0), 60, 60);
    // the shield: Charlie's hat held up over the three (big hat dome tilted toward the spray)
    const dome = A.cropX(A.frameCanvas(lib, 'charlie_prop_parachute', 0), 6, 6);
    rot(dome, 14, [dome.width / 2, dome.height - 4], Z.ACTOR + 4, 170, 104);
    hero('ricky', { x: 144, y: 60, anim: 'run', frame: 1 }, Z.ACTOR + 2);
    hero('charlie', { x: 168, y: 60, anim: 'shield', frame: 0, facing: -1 }, Z.ACTOR + 3);
    hero('jade', { x: 194, y: 60, anim: 'run', frame: 0 }, Z.ACTOR + 1);
    bang(146, 106); sweat(136, 98); sweat(158, 100);
  }
  // ================================================================ A7 · 29.5 · COLOUR STOPS IT
  {
    const k = kf.A7; OX = k.ox; k.blankX = 22; k.active = 'jade'; k.slot = 'jade1'; k.tip = true;
    parallax(k.blankX);
    const b = batches();
    for (let x = 0; x < 336; x += 16) { if (x + 8 >= k.blankX) b.bg.draw(`fl60_${(x / 16) % 3}`, OX + x, 0); if (x < 160) b.bg.draw('cap' + ((x / 16) % 12), OX + x, 50); }
    // skid smears (rainbow rubbed along the tiles) + dust under the Eraser
    for (let i = 0; i < 8; i++) b.fx.draw('px2', OX + 64 + i * 5, 61, { solid: PAL.rainbow[(i * 3) % 12] });
    b.fx.draw('puff3', OX + 108, 64); b.fx.draw('puff2', OX + 118, 62); b.fx.draw('puff4', OX + 96, 66);
    for (let i = 0; i < 3; i++) b.fx.draw('speed14', OX + 14 + i * 4, 90 + i * 16);
    b.end();
    // Eraser leaning back, skidding, rainbow smear on its face
    eraserQ(A.eraserSmear(lib, 0), 54, 60, Z.PROP + 5, 8, [ER.ax, ER.ay]);
    sweat(126, 142); sweat(134, 136);
    const sq = st.add(new Quad(canvasTex(A.burstCanvas(62, 26)), 62, 26, { anchor: [31, 13] }), Z.TEXT); sq.place(OX + 136, 122);
    pop('SQUEAK!', 136, 122, { color: PAL.red, outline: null, z: Z.TEXT + 1 });
    hero('jade', { x: 172, y: 60, anim: 'draw_rainbow', frame: 0, facing: -1 }, Z.ACTOR + 2);
    hero('charlie', { x: 236, y: 60, anim: 'run', frame: 2 }, Z.ACTOR + 1);
    hero('ricky', { x: 284, y: 60, anim: 'run', frame: 4 }, Z.ACTOR);
  }
  // ================================================================ A8 · 33.3 · DRAW AHEAD: 一 platforms, 丶 spring, erase a door
  {
    const k = kf.A8; OX = k.ox; k.missing = 0.22; k.active = 'jade'; k.slot = 'jade0';
    parallax(null, null, 60);
    const b = batches();
    for (let x = -16; x < 48; x += 16) { const m = ((x * 2654435761) >>> 0) / 4294967296 < 0.4; b.bg.draw(m ? 'chk16' : `fl60_${((x / 16) % 3 + 3) % 3}`, OX + x, 0, m ? { sx: 2, sy: 7.5 } : {}); }
    const yi = async (cx, top, size = 72, style = 'graphite') => { const h = await Hanzi2D.create('一', { size, bold: 2, style }); h.place(0, 0); const bx = h.strokeBox(0); h.place(OX + cx - (bx.x0 + bx.x1) / 2, top - bx.y1); st.add(h.group, Z.PLATFORM + 3); return h; };
    await yi(84, 66, 64); await yi(192, 90, 72); await yi(274, 98, 84);
    // the coloured 丶 = a spring (a function), standing on the end of the first 一
    const dian = await Hanzi2D.create('丶', { size: 80, bold: 3, style: 'rainbow' }); dian.place(0, 0); const db = dian.strokeBox(0);
    const SPR = 14; spr(A.springCanvas(SPR), 6, SPR - 1, Z.PLATFORM + 3, 102, 66);
    dian.place(OX + 102 - (db.x0 + db.x1) / 2, 66 + SPR - db.y0 - 1); st.add(dian.group, Z.PLATFORM + 4);
    // Ricky launched up off the spring (his short jump could never make this gap)
    rot(A.frameCanvas(lib, 'ricky_jump', 0), 10, [18, 43], Z.ACTOR, 116, 112);
    spr(A.motionLines(3, 14, 6, PAL.rainbow[8]), 0, 0, Z.FX, 104, 108);
    pop('BOING!', 64, 132, { color: PAL.rainbow[9], font: 'px' });
    hero('charlie', { x: 190, y: 90, anim: 'run', frame: 2 }, Z.ACTOR + 1);
    // graphite wall ahead; Jade has flipped her graphite pencil and rubs a doorway with its PINK/ORANGE cap
    const W = 22, WH = 52; const wall = A.wallCanvas(W, WH, [4, WH - 30, 12, 30]);
    spr(wall, 0, WH - 1, Z.PLATFORM + 4, 290, 98);
    const JX = 271;
    spr(A.jadeEmptyHand(lib), 36, 43, Z.ACTOR + 2, JX, 98);                         // jade_draw_graphite, line + pencil removed
    spr(A.tinyPencil('graphite', 15), 0, 2, Z.ACTOR + 3, JX + 4, 98 + (43 - 20));   // graphite tip in her fist, pink cap on the wall
    for (let i = 0; i < 9; i++) b.fx.draw(i % 3 ? 'px1' : 'px2', OX + 290 + (i * 5) % 13 - 4, 104 + (i * 7) % 18, { solid: i % 2 ? PAL.capPink : '#ffc0a0' });  // pink rubber crumbs
    b.fx.draw('spark', OX + 293, 124, { solid: PAL.white });
    b.end();
  }
  // ================================================================ A9 · 34.5 · EDGE: off the last tile; the Eraser stays put
  {
    const k = kf.A9; OX = k.ox; k.missing = 0.42; k.voidX = 170;
    parallax(null, k.voidX);
    const b = batches();
    floor(b, -16, 170);
    for (let x = 0; x < 170; x += 16) if (((x * 2654435761) >>> 0) / 4294967296 < 0.3) b.bg.draw('chk16', OX + x, 0, { sx: 2, sy: 7.5 });
    // skid marks + crumbs dribbling over the edge into the void
    for (let i = 0; i < 4; i++) b.fx.draw('speed14', OX + 48 + i * 8, 62 + (i % 2) * 2);
    for (let i = 0; i < 6; i++) b.fx.draw('ecrumb' + (i % 4), OX + 172 + (i % 3) * 3, 56 - i * 6);
    b.end();
    spr(A.tornEdge(130), 0, 0, Z.BG2, 168, 170);
    const cubes = [[214, 120, 20], [290, 60, 16], [262, 150, 14]];
    cubes.forEach(([x, y, s], i) => { const cv = KA.cubeCanvas(s, PAL.gizmoBlue, i % 2 === 1); spr(cv, 0, cv.height - 1, Z.PARALLAX + 2, x, y); });
    const ch = st.add(new CheckerRect(3), Z.PARALLAX + 3); ch.setRect(OX + 300, 104, 12, 12);
    // the Eraser at the edge, leaning over to peer down, staying put
    eraserQ(A.frameCanvas(lib, 'eraser_chase_x2', 1), 170, 60, Z.PROP + 5, -9, [122, ER.ay]);
    pop('?', 204, 124, { color: PAL.white, font: 'px', scale: 2 });
    pop('...', 200, 108, { color: PAL.g4, font: 'px', outline: null });
    // the party, falling into the VOID (Ricky just off the edge, Jade furthest and lowest)
    rot(A.frameCanvas(lib, 'ricky_jump', 1), 24, [18, 22], Z.ACTOR, 206, 80);
    rot(A.frameCanvas(lib, 'charlie_jump', 1), -22, [18, 22], Z.ACTOR + 1, 244, 70);
    rot(hangCv('jade', 1), 10, [18, 20], Z.ACTOR + 2, 284, 64);
    spr(A.motionLines(3, 12, 7, PAL.blueHi), 0, 0, Z.FX, 198, 116);
    spr(A.motionLines(3, 12, 7, PAL.blueHi), 0, 0, Z.FX, 236, 106);
    spr(A.motionLines(3, 12, 7, PAL.blueHi), 0, 0, Z.FX, 276, 112);
  }

  // ---------------------------------------------------------------- UI
  const hud = st.addUI(new HUD(lib), ZUI.HUD);
  const jp = A.jadePortraitDown(lib).map((cv) => canvasTex(cv));
  // (three.js sorts by the parent Group's renderOrder first, so HUD overlays live in their own Group above the HUD's)
  const hudTop = new THREE.Group();
  const jadeP = new Quad(jp[0], 32, 32); jadeP.place(4 + 76 + 1, 2);
  const hi = new Quad(canvasTex(A.hudHi()), 36, 36);
  const slotHi = new Quad(canvasTex(A.hudHi(20, 20, '#ffffff')), 20, 20);
  hudTop.add(jadeP, hi, slotHi); st.addUI(hudTop, ZUI.HUD + 1);
  const HUD_I = { charlie: 0, jade: 1, ricky: 2 };
  const subTop = st.addUI(new Subtitle({ y: 150 }), ZUI.SUBS);
  const tip = st.addUI(new Banner({ text: "TIP: COLOR CAN'T BE ERASED", font: 'skb', color: PAL.yellow }, { style: 'dialog', padX: 6, padY: 4 }), ZUI.BANNER);
  const words = [5, 6, 7, 8, 9].flatMap((id) => T.words(id));
  const tag = st.addUI(new TextSprite({ text: '', font: 'sk', color: PAL.white, outline: PAL.ink }, { anchor: 'tl' }), ZUI.TOP);

  return {
    stage: st,
    update(t) {
      let k = K[0]; for (const c of K) if (t >= c.t - 1e-6) k = c;
      st.cam.set({ x: k.ox + 160, y: 90, zoom: 1, shake: [0, 0] });
      // backgrounds
      paper.cover(st.cam); paper.u.uBlankX.value = k.blankX !== null ? k.ox + k.blankX : -1e9; paper.u.uMissing.value = k.missing;
      blue.visible = k.voidX !== null;
      if (blue.visible) { const L = st.cam.left; blue.position.set(k.ox + k.voidX, st.cam.bottom - 16, 0); blue.scale.set(L + 336 - (k.ox + k.voidX), 212, 1); blue.u.uTime.value = t;
        paper.scale.set(k.ox + k.voidX - paper.position.x, paper.scale.y, 1); }
      if (k.dimRect) { k.dimRect.setSize(st.cam.vw + 4, st.cam.vh + 4); k.dimRect.place(st.cam.left - 2, st.cam.bottom - 2); }
      // HUD (+ the hair-down Jade portrait whenever her pencils are out; acting-hero highlight)
      const singing = words.some((w) => t >= w.start && t < w.end) && Math.floor(t * 8) % 2 === 0;
      hud.set({ singing: { jade: singing }, loc: locAt(t) });
      jadeP.visible = !k.hairUp; jadeP.material.setMap(jp[singing ? 1 : 0]);
      hi.visible = !!k.active; if (k.active) hi.place(4 + HUD_I[k.active] * 76 - 1, 0);
      slotHi.visible = !!k.slot; if (k.slot) { const who = k.slot.slice(0, -1), s = +k.slot.slice(-1); slotHi.place(4 + HUD_I[who] * 76 + 37 + s * 19 - 1, 8); }
      // subtitles: same rules as act1/kaizo.js (top slot)
      let topC = null;
      for (const id of [5, 6, 7, 8, 9]) { const c = subtitleFor(t, id, { hold: 0.25 }); if (c) topC = c; }
      if (topC && t > T.word(7, 7).start + 0.9 && t < T.line(8).start - 0.1) topC = null;
      if (t >= 34.6) topC = null;
      subTop.set(topC);
      tip.visible = !!k.tip; tip.place(236, 136);
      tag.set({ text: `${k.id}` }); tag.place(2, 178); tag.visible = false;
    },
  };
}
