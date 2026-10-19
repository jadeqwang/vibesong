// MOCKS B · 34.69-87 · keyframe tableaux for the game-design pass (docs/game_design_acts1-3.md, beats 34.69-86.4).
// STATIC: update(t) picks the nearest keyframe at or below t and poses that composition (no in-betweens).
//   B1 35.60 VOID FALL         hat-parachute trio falling; 说出来 dropping out of Jade's bubble; Ricky's chord slams 说
//   B2 39.70 未来 WHILE DRAWN   rainbow tip mid-丿 on 未 (一 一 丨 丿 乀); heroes hop onto unfinished strokes
//   B3 40.90 UPDRAFT           来 done; Ricky's sustain = rising waves; the parachute rides the updraft; pages above
//   B4 43.95 READING FREEZE    page sky; Jade 字帖, Ricky TAB, Charlie SPEC
//   B5 52.70 THE PROMPT        prompt box + 3 attachment chips, ENTER just pressed, build bar docks (2%)
//   B6 60.00 OH OH OH          coloured level; chord clicks switch 2 (spring / lift / door), bar 55%
//   B7 64.00 GOES FROM THERE   pulled back; sound rings from Ricky; hats seed new chunks; Jade colours ahead; bar 75%
//   B8 73.30 出发 GATE           three pressure plates, 出 lit, 发 still a blueprint; bar stuck at 99%
//   B9 79.60 LAUNCH            graphite steps + note ramp + trampoline; 一笔一画 slammed; bar 100%
//   B10 81.80 THE TURN         OVERLAY ONLY on a #ff00ff key (parachute trio + REALITY LV 2 card); composited in
//                              PIL over the main-show render at 81.8 (see the B mock report).
// Jade holds her pencils in every B frame: hair DOWN (Actor pencil:true) and a hair-down HUD portrait override.
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { locAt } from '../../show/loc.js';
import { Stage2D, Z, ZUI } from '../../core/stage2d.js';
import { PAL } from '../../core/palette.js';
import { BlueprintBG, Atlas, Batch, addParticleSprites, sparkle, CheckerRect } from '../../core/fx.js';
import { Actor } from '../../core/sprites.js';
import { TextSprite } from '../../core/text.js';
import { Quad, canvasTex, rect, pixelCanvas } from '../../core/gfx.js';
import { HUD, HUD_H, Subtitle, subtitleFor, panel, Banner } from '../../core/ui.js';
import { Hanzi2D } from '../../core/hanzi2d.js';
import { Pencil, flowerCanvas, FLOWER_COLORS, checkerCanvas, bubbleCanvas, iconCanvas } from '../../core/props.js';
import { arcCanvas } from '../act1/common.js';
import { extrudedChar, cubeCanvas, axisGizmoCanvas } from '../act1/kaizo_art.js';
import * as A2 from '../act2/art.js';
import { buildLaunchSet, LAUNCH } from '../act2/launch_set.js';
import * as B from './b_art.js';
import { BuildBar } from './b_ui.js';
import { mulberry32 } from '../../util.js';

const KEYS = [['B1', 35.6], ['B2', 39.7], ['B3', 40.9], ['B4', 43.95], ['B5', 52.7], ['B6', 60.0], ['B7', 64.0], ['B8', 73.3], ['B9', 79.6], ['B10', 81.8]];
const KEY_BG = '#ff00ff';
const K = {};   // keyframe id -> pose(t)

export async function setup(ctx) {
  const lib = ctx.lib;
  const st = new Stage2D(ctx, { bg: PAL.void });
  const bg = st.add(new BlueprintBG(), Z.BG);   // loose mesh: sorts first

  // ---------------------------------------------------------------- ownership: every object belongs to 1+ keyframes
  const owned = []; // [obj, Set(ids)]
  const own = (ids, obj) => { owned.push([obj, new Set([].concat(ids))]); return obj; };
  // three.js: a Group's renderOrder becomes the sort key (groupOrder) of everything inside it, and loose meshes sort
  // before ALL groups. So every object goes into its own Group: then the Z / ZUI layer order holds everywhere.
  const lay = (obj, z, ui = false) => { const g = new THREE.Group(); g.add(obj); (ui ? st.addUI(g, z) : st.add(g, z)); return obj; };
  const add = (ids, obj, z) => own(ids, lay(obj, z));
  const addUI = (ids, obj, z) => own(ids, lay(obj, z, true));
  const quad = (cv, anchor = [0, 0]) => new Quad(canvasTex(cv), cv.width, cv.height, { anchor });
  const spriteQuad = (name, f = 0) => { const sp = lib.get(name); const q = new Quad(sp.tex, sp.w, sp.h, { anchor: [sp.meta.anchor[0], sp.h - 1 - sp.meta.anchor[1]] }); q.setRect(f / sp.n, 0, 1 / sp.n, 1); return q; };
  const rope = (ids, x0, y0, x1, y1, c, z = Z.ACTOR_BACK) => { const r = B.ropeCanvas(Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), c); return add(ids, quad(r.cv), z).place(r.x, r.y); };

  // ---------------------------------------------------------------- atlas + batches
  const atlas = addParticleSprites(new Atlas(2048));
  FLOWER_COLORS.forEach((c, i) => atlas.add(`flower${i}`, flowerCanvas(i, 4), [2, 0]));
  [8, 12, 16, 20, 24].forEach((r) => atlas.add('arc' + r, arcCanvas(r), [0, r + 1]));
  [6, 10, 14, 18, 22, 26, 30].forEach((r) => atlas.add('wup' + r, B.waveUp(r), [r + 1, 0]));
  [6, 10, 14].forEach((L) => atlas.add('speed' + L, pixelCanvas(L, 1, (g, px) => px(0, 0, '#9ec2ff', L, 1)), [L, 0]));
  [10, 16, 24].forEach((L) => atlas.add('fall' + L, B.streakV(L, '#3d6ac8'), [0, 0]));
  atlas.add('drift', B.streakV(6, '#7ad8ff'), [0, 0]);
  atlas.add('fix', A2.fixtureTile(0), [0, 0]); atlas.add('fix1', A2.fixtureTile(1), [0, 0]);
  [0, 1, 2].forEach((v) => atlas.add('grass' + v, A2.grassTile(v), [0, 0])); [0, 1].forEach((v) => atlas.add('dirt' + v, A2.dirtTile(v), [0, 0]));
  atlas.add('brick', A2.brickTile(0), [0, 0]);
  atlas.add('spring0', A2.springCanvas(0, true), [7, 0]); atlas.add('spring1', A2.springCanvas(1, true), [7, 0]);
  atlas.add('doorShut', A2.doorCanvas(0, true), [10, 0]); atlas.add('doorOpen', A2.doorCanvas(1, true), [10, 0]);
  atlas.add('water', A2.waterCanvas(1, 48), [0, 0]);
  const PAGES = ['page', 'manual', 'forum', 'code'];
  for (let i = 0; i < 12; i++) atlas.add('pg' + i, A2.pageCanvas(PAGES[i % 4], i + 1), [0, 0]);
  [14, 18, 24].forEach((s) => { atlas.add('cube' + s, cubeCanvas(s, PAL.gizmoBlue, false), [0, 0]); atlas.add('cubeD' + s, cubeCanvas(s, PAL.gizmoBlue, true), [0, 0]); });
  atlas.add('chk', checkerCanvas(4), [0, 0]);
  atlas.add('spawn', pixelCanvas(16, 16, (g, px) => { px(0, 0, '#ffffff', 16, 1); px(0, 15, '#ffffff', 16, 1); px(0, 0, '#ffffff', 1, 16); px(15, 0, '#ffffff', 1, 16); }), [0, 0]);
  atlas.add('bp', pixelCanvas(16, 16, (g, px) => { for (let i = 0; i < 16; i += 3) { px(i, 0, PAL.gizmoBlue, 2, 1); px(i, 15, PAL.gizmoBlue, 2, 1); px(0, i, PAL.gizmoBlue, 1, 2); px(15, i, PAL.gizmoBlue, 1, 2); } }), [0, 0]);
  atlas.add('smear', pixelCanvas(16, 16, (g, px) => { for (let y = 0; y < 16; y += 2) px(0, y, '#3a4f9a', 16, 1); }), [0, 0]);
  PAL.rainbow.forEach((h, i) => atlas.add('note' + i, B.noteBlock(h), [0, 0]));
  PAL.rainbow.forEach((h, i) => atlas.add('cblk' + i, pixelCanvas(16, 16, (g, px) => { px(0, 0, '#14121c', 16, 16); px(1, 1, h, 14, 14); px(1, 1, '#ffffff', 14, 2); px(1, 13, '#00000055', 14, 2); }), [0, 0]));
  ['wire', 'wireOn', 'wireHit', 'wireOff'].forEach((k, i) => atlas.add(k, B.dot(['#9ec2ff', '#3ad06a', '#ffe14d', '#6b6b72'][i], 2), [1, 1]));
  atlas.add('arrowUp', B.arrowUp(), [3, 0]);
  atlas.add('impact', B.impactCanvas(14), [14, 14]); atlas.add('impactS', B.impactCanvas(9), [9, 9]);
  const hatSp = lib.get('charlie_hat_boomerang');
  [0, 1, 2].forEach((f) => atlas.add('hat' + f, B.spriteFrame(lib, 'charlie_hat_boomerang', f), [8, 0]));
  void hatSp;
  const par = lay(new Batch(atlas, 600), Z.PARALLAX);
  const tiles = lay(new Batch(atlas, 3000), Z.PLATFORM);
  const props = lay(new Batch(atlas, 800), Z.PROP);
  const back = lay(new Batch(atlas, 600), Z.ACTOR_BACK);
  const fx = lay(new Batch(atlas, 2000), Z.FX);
  const BATCHES = [par, tiles, props, back, fx];

  // ---------------------------------------------------------------- shared actors
  const jade = lay(new Actor(lib, 'jade', { name: 'jade' }), Z.ACTOR + 2);
  const charlie = lay(new Actor(lib, 'charlie'), Z.ACTOR + 1);
  const ricky = lay(new Actor(lib, 'ricky'), Z.ACTOR);
  const J = (s) => jade.set({ facing: 1, ...s, pencil: true });     // CANON: pencils in hand in every B frame -> hair DOWN
  const C = (s) => charlie.set({ facing: 1, ...s });
  const R = (s) => ricky.set({ facing: 1, ...s });

  // ---------------------------------------------------------------- UI (shared)
  const hud = st.addUI(new HUD(lib), ZUI.HUD);
  hud.portraits.jade.q.visible = false;   // its frames show the bun + pencils; ours is hair-down (pencils in hand)
  const jadePortrait = lay(new Quad(canvasTex(B.hairDownPortrait(lib)), 32, 32), ZUI.HUD + 1, true); jadePortrait.place(81, 2);
  const hl = [0, 1, 2].map((i) => { const q = lay(quad(B.frameCanvas(36, 36)), ZUI.HUD + 2, true); q.place(3 + i * 76, 0); return q; });
  const sub = st.addUI(new Subtitle({ y: HUD_H + 3 }), ZUI.SUBS);
  const bar = st.addUI(new BuildBar(), ZUI.BANNER);
  const axis = addUI(['B1', 'B2', 'B3'], quad(axisGizmoCanvas()), ZUI.BACK); axis.place(288, 148);

  // ================================================================ B1 · 35.6 VOID FALL
  {
    const id = 'B1';
    const canopy = add(id, spriteQuad('charlie_prop_parachute', 0), Z.ACTOR + 3); canopy.place(204, 150);
    rope(id, 178, 152, 194, 143, '#5a3a18'); rope(id, 230, 152, 214, 143, '#5a3a18');
    // Jade's speech bubble (pencil-mic): 说出来 already dropped (grey), 它就存在 still to come (ink)
    const bub = add(id, quad(bubbleCanvas(62, 34, 6)), Z.TEXT); bub.place(236, 108);
    const bt = add(id, new TextSprite({ spans: [{ text: '说出来', color: '#b8b8c8' }, { text: '\n' }, { text: '它就存在', color: PAL.ink }], font: 'fp12' }, { anchor: 'tl' }), Z.TEXT + 1); bt.place(243, 146);
    // falling characters: ghosts (pixel-dissolved, not yet solid) and 说 SLAMMED solid by the chord
    const ghost = (ch, x, y, k) => { const q = add(id, quad(extrudedChar(ch)), Z.PLATFORM + 2); q.setScale(2); q.place(x, y); q.material.uniforms.dissolve.value = k; q.opacity = 0.5; return q; };
    ghost('出', 252, 50, 0.12); ghost('来', 284, 70, 0.2); ghost('它', 296, 106, 0.3);
    const slamChk = add(id, new CheckerRect(4), Z.PLATFORM + 1); slamChk.setRect(90, 56, 58, 56);
    const shu = add(id, quad(extrudedChar('说')), Z.PLATFORM + 3); shu.setScale(3); shu.place(96, 60);
    const lbl = add(id, new TextSprite({ text: 'SLAM!', font: 'px', color: PAL.yellow, outline: PAL.ink, outline8: true }, { anchor: 'bc' }), Z.TEXT); lbl.place(119, 116);
    K.B1 = (t) => {
      C({ x: 204, y: 104, anim: 'charlie_hang', frame: 0 });
      J({ x: 236, y: 64, anim: 'sing', frame: 1 });
      R({ x: 182, y: 60, anim: 'chord', frame: 1, facing: -1 });
      // Ricky's guitar strap hooked on Charlie's boot (he dangles and plays)
      // shockwave: chord blast -> 说
      ['arc8', 'arc12', 'arc16', 'arc20'].forEach((a, i) => fx.draw(a, 150 - i * 3, 82, { flip: true }));
      fx.draw('impact', 150, 84);
      // falling: streaks rising past everyone (we are falling), trails under the ghosts
      const r = mulberry32(11);
      for (let i = 0; i < 26; i++) { const x = Math.floor(r() * 320), y = 40 + Math.floor(r() * 140); back.draw(['fall10', 'fall16', 'fall24'][i % 3], x, y); }
      for (const [x, y] of [[274, 88], [302, 108], [288, 128]]) for (let k = 0; k < 4; k++) fx.draw('px1', x, y + k * 4);
      // void dressing
      [[20, 140, 'cube18'], [60, 46, 'cubeD14'], [150, 150, 'cube14'], [300, 40, 'cubeD24']].forEach(([x, y, n]) => par.draw(n, x, y));
      [[12, 104], [70, 156], [154, 44]].forEach(([x, y]) => par.draw('chk', x, y));
    };
    rope(id, 194, 104, 180, 88, '#3a2a10');   // strap: Charlie's boot -> Ricky's shoulder
    rope(id, 214, 104, 222, 98, '#3a2a10', Z.ACTOR + 3);   // Jade's grip hand
    const lorem = add(id, new TextSprite({ text: 'lorem ipsum dolor sit amet\nTODO: level_1_2.json\nnull', font: 'fp8', color: '#2a4a8a' }, { anchor: 'bl' }), Z.PARALLAX + 2); lorem.place(8, 150);
  }

  // ================================================================ B2 · 39.7 未来 drawn while they climb
  const wei = await Hanzi2D.create('未', { size: 120, style: 'rainbow', shadowColor: '#0a1030', bold: 2 });
  const weiGhost = await Hanzi2D.create('未', { size: 120, style: 'solid', shadow: false, bold: 2 });
  {
    const id = 'B2';
    const WX = 136, WY = 46;
    weiGhost.place(WX, WY); weiGhost.u.uColor.value.set('#1c3270'); add(id, weiGhost.group, Z.PLATFORM);   // strokes still to come
    wei.place(WX, WY); add(id, wei.group, Z.PLATFORM + 2);
    const P = [1, 1, 1, 0.55, 0]; P.forEach((p, i) => wei.setProgress(i, p));
    const tip = wei.medianAt(3, P[3]), end = wei.medianAt(3, 1);
    const pen = add(id, new Pencil({ kind: 'rainbow', len: 44 }), Z.FRONT + 1); pen.set({ x: tip[0], y: tip[1], angle: -34 });
    // stroke-order legend (笔顺): done / drawing / next
    const leg = add(id, new TextSprite({ spans: [{ text: '笔顺 ', color: '#9ec2ff' }, { text: '一 一 丨 ', color: '#5a6a9a' }, { text: '丿', color: PAL.yellow }, { text: ' 乀', color: '#9ec2ff' }], font: 'fp12', outline: '#05060d' }, { anchor: 'tl' }), Z.TEXT);
    leg.place(8, 174);
    const now = add(id, new TextSprite({ text: '▲ drawing', font: 'sk', color: PAL.yellow }, { anchor: 'tl' }), Z.TEXT); now.place(68, 160);
    ['存', '在'].forEach((ch, i) => { const q = add(id, quad(extrudedChar(ch)), Z.PLATFORM + 1); q.setScale(2); q.place(4 + i * 34, 72); });
    const s1L = wei.strokeTopAt(1, WX + 30), s1R = wei.strokeTopAt(1, WX + 82);
    K.B2 = (t) => {
      C({ x: WX + 82, y: s1R, anim: 'idle', frame: 0 });                                // Charlie on the long 一 (just drawn)
      const jx = WX + 14, jy = tip[1] + 14;
      J({ x: jx, y: jy, anim: 'run_pencil', frame: 1, facing: -1 });                  // Jade mid-hop: she lands where the tip is drawing
      R({ x: 100, y: 116, anim: 'jump', frame: 0 });                                    // Ricky (heavy) still in the air from 在
      const arc = (x0, y0, x1, y1, h, c) => { for (let k = 1; k < 12; k++) { const u = k / 12; fx.draw('px2', x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + h * 4 * u * (1 - u), { solid: c }); } };
      arc(52, 104, 96, 116, 14, '#ffffff');
      arc(WX + 32, s1L, jx + 4, jy, 10, '#ffffff');
      arc(jx - 2, jy - 2, end[0] + 2, end[1] + 3, 6, PAL.yellow);                     // her landing: the end of the 丿 (not drawn yet)
      sparkle(fx, 0.2, 0, tip[0], tip[1], { n: 10, r: 14, dur: 0.5 });
      [[20, 128, 'cube18'], [276, 70, 'cubeD14'], [272, 140, 'cube14']].forEach(([x, y, n]) => par.draw(n, x, y));
    };
  }

  // ================================================================ B3 · 40.9 the updraft
  const lai = await Hanzi2D.create('来', { size: 96, style: 'rainbow', shadowColor: '#0a1030', bold: 2 });
  {
    const id = 'B3';
    const LX = 222, LY = -14;
    lai.place(LX, LY); lai.setAll(1); add(id, lai.group, Z.PLATFORM + 2);
    const CX = 196, CY = 106;                                    // Charlie's feet (hang)
    const canopy = add(id, spriteQuad('charlie_prop_parachute', 1), Z.ACTOR + 3); canopy.place(CX, CY + 44);
    rope(id, CX - 26, CY + 46, CX - 10, CY + 41, '#5a3a18'); rope(id, CX + 26, CY + 46, CX + 10, CY + 41, '#5a3a18');
    rope(id, CX - 4, CY + 14, CX - 22, CY - 6, '#3a2a10');      // Ricky's strap
    const lbl = add(id, new TextSprite({ text: 'UPDRAFT', font: 'px', color: '#9ee6ff', outline: '#05060d', outline8: true }, { anchor: 'bc' }), Z.TEXT); lbl.place(64, 118);
    K.B3 = (t) => {
      C({ x: CX, y: CY, anim: 'charlie_hang', frame: 1 });
      J({ x: CX + 18, y: CY - 38, anim: 'drum', frame: 1 });                          // Jade hangs from Charlie's boots
      R({ x: CX - 24, y: CY - 40, anim: 'sustain', frame: 1, facing: -1 });            // Ricky dangles by his strap, holding the note
      // his held note: rising sound waves from the headstock up into the canopy = the updraft they ride
      [6, 10, 14, 18, 22, 26].forEach((r, i) => back.draw('wup' + r, CX - 42 + i * 3, CY - 8 + i * 9));
      // the updraft also rises off the finished 来
      const rr = mulberry32(5);
      for (let i = 0; i < 40; i++) { const x = 140 + Math.floor(rr() * 160), y = 40 + Math.floor(rr() * 110); back.draw('drift', x, y); }
      // first floating pages appear above (camera tilting up)
      [[4, 138, 'pg0'], [40, 158, 'pg9'], [104, 160, 'pg2'], [252, 156, 'pg5']].forEach(([x, y, n]) => par.draw(n, x, y, { color: '#8a90b0' }));
      sparkle(fx, 0.25, 0, LX + 48, 56, { n: 12, r: 30, dur: 0.6 });
      for (let k = 0; k < 3; k++) { fx.draw('arrowUp', 312, 96 + k * 12, { color: '#9ec2ff' }); fx.draw('arrowUp', 8, 80 + k * 12, { color: '#9ec2ff' }); }
    };
  }

  // ================================================================ B4 · 43.95 the reading freeze
  {
    const id = 'B4';
    const plat = (x, y, w, seed) => add(id, quad(B.platformPage(w, seed)), Z.PLATFORM).place(x, y);
    plat(18, 62, 48, 1); plat(120, 86, 48, 2); plat(226, 56, 48, 3);
    add(id, quad(B.copybookPage()), Z.ACTOR_FRONT).place(62, 70);
    add(id, quad(B.specPage()), Z.ACTOR_FRONT).place(162, 94);
    add(id, quad(B.tabPage()), Z.ACTOR_FRONT).place(262, 66);
    const pause = add(id, new TextSprite({ text: '❚❚ READ', font: 'sk', color: '#9ec2ff' }, { anchor: 'tl' }), Z.TEXT); pause.place(6, 176);
    K.B4 = (t) => {
      J({ x: 44, y: 71, anim: 'sing', frame: 0 });
      C({ x: 144, y: 95, anim: 'idle', frame: 0 });
      R({ x: 246, y: 65, anim: 'idle', frame: 0 });
      // a sky of pages (docs, manuals, forum threads, code) drifting like clouds
      const r = mulberry32(3);
      for (let i = 0; i < 16; i++) { const x = Math.floor(r() * 340) - 20, y = 40 + Math.floor(r() * 150); par.draw('pg' + (i % 12), x, y, { color: i % 2 ? '#5a6080' : '#8a90b0' }); }
      // reading lines from eyes to pages
      for (const [x, y] of [[54, 105], [154, 129], [256, 99]]) for (let k = 0; k < 3; k++) fx.draw('px1', x + k * 2, y - k, { solid: '#ffffff' });
    };
  }

  // ================================================================ B5 · 52.7 the prompt
  {
    const id = 'B5';
    const X = 40, Y = 82, W = 240, H = 54;
    const box = addUI(id, panel(W, H, 'dialog'), ZUI.DIALOG); box.place(X, Y);
    let cx = X + 6;
    for (const lab of ['字帖', 'tab', 'spec']) { const cv = B.chipCanvas(lab); const q = addUI(id, quad(cv), ZUI.DIALOG + 0.5); q.place(cx, Y + H - 17); cx += cv.width + 4; }
    const l1 = addUI(id, new TextSprite({ text: '// what do I need?', font: 'fp12', color: '#7aa08a' }), ZUI.DIALOG + 0.5); l1.place(X + 7, Y + 20);
    const l2 = addUI(id, new TextSprite({ text: '> level up reality', font: 'fp12', color: PAL.termGreen }), ZUI.DIALOG + 0.5); l2.place(X + 7, Y + 5);
    const ent = addUI(id, quad(B.enterKey(true)), ZUI.DIALOG + 0.6); ent.place(X + 9 + l2.w, Y + 4);
    const ck = addUI(id, quad(B.checkGlyph()), ZUI.DIALOG + 0.6); ck.place(X + W - 50, Y + 8);
    const ok = addUI(id, new TextSprite({ text: 'on it', font: 'fp12', color: PAL.yellow }), ZUI.DIALOG + 0.5); ok.place(X + W - 39, Y + 5);
    K.B5 = (t) => {
      J({ x: 152, y: 38, anim: 'drum', frame: 1 });
      C({ x: 58, y: 38, anim: 'idle', frame: 0 });
      R({ x: 262, y: 38, anim: 'idle', frame: 0, facing: -1 });
      for (let x = -4; x < 330; x += 4) tiles.draw('px1', x, 37, { solid: PAL.gizmoBlue });
      sparkle(fx, 0.12, 0, 132, 80, { n: 6, r: 10, color: '#58f08a' }); sparkle(fx, 0.12, 0, 174, 80, { n: 6, r: 10, seed: 3, color: '#58f08a' });
      [[14, 60, 'cubeD18'], [292, 72, 'cube14'], [96, 46, 'cubeD14']].forEach(([x, y, n]) => par.draw(n, x, y));
      // blueprint answers start to sketch in around the edges
      [[8, 100], [24, 100], [280, 100], [296, 100], [296, 116]].forEach(([x, y]) => tiles.draw('bp', x, y));
    };
  }

  // ================================================================ B6 · 60.0 oh oh oh: three clicks, three functions
  {
    const id = 'B6';
    const SHOT = 136;
    const S = [[112, SHOT + 8, 'on'], [182, SHOT - 9, 'hit'], [252, SHOT + 8, 'off']];
    S.forEach(([x, y, s], i) => add(id, quad(B.switchBlock(i + 1, s)), Z.PROP + 2).place(x - 9, y));
    const lift = add(id, quad(B.liftCanvas()), Z.PLATFORM + 2); lift.place(166, 70);
    const lbls = [['1 SPRING', 112, PAL.green], ['2 LIFT', 182, PAL.yellow], ['3 DOOR', 252, '#ff6a7a']];
    lbls.forEach(([s, x, c]) => add(id, new TextSprite({ text: s, font: 'skb', color: c, outline: '#05060d', outline8: true }, { anchor: 'bc' }), Z.TEXT).place(x, 46));
    K.B6 = (t) => {
      for (let x = -16; x < 340; x += 16) { tiles.draw('grass' + (((x / 16) % 3 + 3) % 3), x, 44); tiles.draw('dirt' + ((x / 16) & 1), x, 28); }
      [16, 32, 48].forEach((x) => tiles.draw('brick', x, 100));                        // Ricky's ledge
      R({ x: 36, y: 116, anim: 'chord', frame: 1 });
      // the chord shot travels across the screen and clicks switch 2
      for (let x = 74; x < 168; x += 3) fx.draw('px1', x, SHOT, { solid: '#ffe14d' });
      for (let x = 80; x < 170; x += 15) fx.draw('arc' + (x < 120 ? 8 : 12), x, SHOT);
      fx.draw('impact', 182, SHOT); sparkle(fx, 0.15, 0, 182, SHOT, { n: 10, r: 20, color: PAL.yellow });
      // switch 1 already ran a spring: Jade bouncing on it
      props.draw('spring1', 112, 60);
      J({ x: 110, y: 86, anim: 'drum', frame: 1 });
      for (let k = 0; k < 3; k++) back.draw('fall10', 100 + k * 10, 72 + (k % 2) * 3);
      // switch 2 runs a lift: Charlie riding it up
      C({ x: 182, y: 78, anim: 'idle', frame: 1 });
      for (let y = 60; y < 70; y += 4) { props.draw('wireHit', 170, y); props.draw('wireHit', 194, y); }
      [158, 206].forEach((x, i) => { fx.draw('arrowUp', x, 74 + i * 6, { color: '#9ee6ff' }); fx.draw('arrowUp', x, 88 + i * 6, { color: '#9ee6ff' }); });
      // switch 3: the door, still shut
      props.draw('doorShut', 252, 60);
      // wires: each switch to its function (on = green, hit = yellow, off = gray)
      for (let y = 66; y < SHOT + 8; y += 4) props.draw('wireOn', 128, y);
      for (let y = 82; y < SHOT - 9; y += 4) props.draw('wireHit', 196, y);
      for (let y = 92; y < SHOT + 8; y += 4) props.draw('wireOff', 252, y);
      flowers(props, [[70, 60], [140, 60], [222, 60], [294, 60]]);
      [[10, 150, 'cube14'], [296, 108, 'cubeD18']].forEach(([x, y, n]) => par.draw(n, x, y));
    };
  }
  function flowers(b, pts) { pts.forEach(([x, y], i) => b.draw('flower' + (i % 7), x, y)); }

  // ================================================================ B7 · 64.0 and everything goes from there (pulled back)
  const RING_C = [176, 120];
  {
    const id = 'B7';
    [70, 140, 210].forEach((r, i) => { const cv = B.ringCanvas(r, i === 2 ? '#7ad8ff' : '#c8fbff', '#2bb4e8', i === 2 ? 6 : 0); const q = add(id, quad(cv, [Math.floor(cv.width / 2), Math.floor(cv.height / 2)]), Z.FX - 1); q.place(...RING_C); });
    const counter = addUI(id, new TextSprite({ text: '×99', font: 'skb', color: PAL.yellow, shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'bc' }), ZUI.HUD + 3); counter.place(69, 27);
    const hatIc = addUI(id, quad(iconCanvas('hat')), ZUI.HUD + 3); hatIc.place(62, 11);
    // generate the level: islands everywhere; inside the rings they execute (move / spring / open)
    const r = mulberry32(64), isl = [];
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2, d = 40 + Math.pow(r(), 0.8) * 330;
      const x = Math.round((RING_C[0] + Math.cos(a) * d * 1.25) / 16) * 16, y = Math.round((RING_C[1] + 30 + Math.sin(a) * d * 0.62) / 16) * 16;
      if (y < 76 || y > 228 || (Math.abs(x - 176) < 70 && Math.abs(y - 100) < 40)) continue;
      if (isl.some((o) => Math.abs(o.x - x) < 56 && Math.abs(o.y - y) < 24)) continue;
      isl.push({ x, y, n: 2 + Math.floor(r() * 3), kind: r() < 0.3 ? 'brick' : r() < 0.15 ? 'spring' : 'grass', d: Math.hypot(x - RING_C[0], y - RING_C[1]) });
    }
    K.B7 = (t) => {
      for (let x = -192; x < 520; x += 16) for (let y = 12; y > -96; y -= 16) tiles.draw('dirt' + (((x + y) / 16) & 1), x, y);
      for (let x = -192; x < 520; x += 16) { const dd = Math.abs(x - 176); if (dd > 330) { tiles.draw(dd > 360 ? 'bp' : 'spawn', x, 44); continue; } tiles.draw(dd > 240 ? 'fix' : 'grass' + (((x / 16) % 3 + 3) % 3), x, 44); tiles.draw(dd > 240 ? 'fix1' : 'dirt' + ((x / 16) & 1), x, 28); }
      [144, 160, 176, 192].forEach((x) => { tiles.draw('grass1', x, 76); tiles.draw('dirt0', x, 60); });
      R({ x: 172, y: 92, anim: 'sustain', frame: 1 });
      for (const o of isl) {
        const inRing = o.d < 205, far = o.d > 300;
        for (let k = 0; k < o.n; k++) {
          const x = o.x + k * 16;
          if (far) { tiles.draw(o.d > 340 ? 'bp' : 'spawn', x, o.y); continue; }
          if (!inRing) { tiles.draw('fix', x, o.y); continue; }
          const dy = o.kind === 'brick' ? 6 : 0;               // executing: bricks bob, springs fire
          if (dy) { back.draw('smear', x, o.y - 4); back.draw('smear', x, o.y - 8); }
          tiles.draw(o.kind === 'brick' ? 'brick' : 'grass' + (k % 3), x, o.y + dy);
        }
        if (inRing && o.kind === 'spring') props.draw('spring1', o.x + 8, o.y + 16);
        if (inRing && o.kind === 'brick') fx.draw('arrowUp', o.x + o.n * 8, o.y + 26, { color: '#9ee6ff' });
        if (inRing && o.kind === 'grass') props.draw('flower' + (o.x / 16 & 7) % 7, o.x + 6, o.y + 16);
      }
      // Charlie: hat after hat after hat, thrown far out; each landed hat sprouts a chunk
      C({ x: 70, y: 60, anim: 'throw', frame: 1 });
      const throws = [[-120, 214], [-130, 104], [452, 222], [466, 120], [300, 236], [10, 232]];
      throws.forEach(([tx, ty], i) => {
        const x0 = 84, y0 = 92, h = 60 + i * 10;
        for (let k = 1; k < 18; k++) { const u = k / 18; fx.draw('px2', x0 + (tx - x0) * u, y0 + (ty - y0) * u + h * 4 * u * (1 - u), { solid: '#e8c08a' }); }
        tiles.draw('spawn', tx - 24, ty - 16); tiles.draw('grass0', tx - 8, ty - 16); tiles.draw('spawn', tx + 8, ty - 16);
        props.draw('hat0', tx, ty); sparkle(fx, 0.1, 0, tx, ty + 4, { n: 6, r: 14, seed: i + 3 });
      });
      props.draw('hat1', 120, 150); props.draw('hat2', 330, 180);
      // Jade colouring ahead (right edge): gray fixtures ahead of her, colour behind
      for (let x = 352; x < 480; x += 16) tiles.draw(x < 384 ? 'cblk' + ((x / 16) % 12) : 'fix', x, 60);
      J({ x: 368, y: 76, anim: 'draw_rainbow', frame: 0 });
      [[-120, 170, 'cube24'], [440, 220, 'cubeD24'], [-60, 300, 'cube18']].forEach(([x, y, n]) => par.draw(n, x, y));
    };
  }

  // ================================================================ B8 / B9 · the launch set (shared with Act II / Team B)
  const nBefore = st.scene.children.length;
  const set = await buildLaunchSet(st, ctx, { withBackground: false });
  st.scene.children.slice(nBefore).forEach((o) => own(['B8', 'B9'], o));
  const faGhost = await Hanzi2D.create('发', { size: 96, style: 'solid', shadow: false, bold: 2 });
  {
    const id = 'B8';
    faGhost.place(LAUNCH.fa.x, LAUNCH.fa.y); faGhost.u.uColor.value.set('#1f3d7a'); add(id, faGhost.group, Z.PLATFORM + 1);
    const plates = [LAUNCH.party.ricky, LAUNCH.party.charlie, LAUNCH.party.jade].map((x) => add(id, quad(B.plateCanvas(true), [15, 0]), Z.ACTOR_FRONT).place(x, 58));
    void plates;
    const W17 = T.words(17);
    const CH = [['一', 0], ['切', 1], ['从', 2], ['这', 3], ['里', 3], ['出', 4], ['发', 5]];
    CH.forEach(([ch, wi], i) => { const lit = i <= 5; const q = addUI(id, new TextSprite({ text: ch, font: 'fp12', color: i === 5 ? PAL.rainbow[0] : i === 6 ? '#3a4a7a' : PAL.white, outline: PAL.ink, outline8: true, shadow: { dx: 1, dy: -1, color: PAL.ink } }, { anchor: 'c' }), ZUI.BANNER); q.setScale(2); q.place(160 - 3 * 28 + i * 28, 150); void lit; void W17; void wi; });
    K.B8 = (t) => {
      st.cam.set({ x: LAUNCH.camera.x, y: LAUNCH.camera.y, zoom: 1, shake: [0, 0] }); bg.cover(st.cam);
      set.update(t); set.chu.setAll(1); set.chu.place(LAUNCH.chu.x, LAUNCH.chu.y); set.chu.group.visible = true; set.fa.group.visible = false;
      R({ x: LAUNCH.party.ricky, y: 62, anim: 'idle', frame: 0 });
      C({ x: LAUNCH.party.charlie, y: 62, anim: 'idle', frame: 0 });
      J({ x: LAUNCH.party.jade, y: 62, anim: 'drum', frame: 0 });
      // plates wired to the gate: all three pressed -> 出 lights
      for (let x = 60; x < 190; x += 4) props.draw('wireHit', x, 58);
      sparkle(fx, 0.2, 0, 226, 110, { n: 16, r: 46, dur: 0.6 });
      [74, 104, 136].forEach((x, i) => sparkle(fx, 0.15, 0, x, 64, { n: 5, r: 10, seed: 9 + i, color: PAL.yellow }));
    };
  }
  const TITLE9 = [];
  for (const ch of ['一', '笔', '一', '画']) TITLE9.push(await Hanzi2D.create(ch, { size: 40, style: 'solid', shadowColor: '#3a2a10', bold: 2 }));
  {
    const id = 'B9';
    const tramp = add(id, spriteQuad('charlie_prop_trampoline', 2), Z.PROP + 3); tramp.place(220, 100);
    TITLE9.forEach((h, i) => { h.u.uColor.value.set(PAL.gold); h.setAll(1); h.place(30 + i * 44, 124); add(id, h.group, Z.HERO); });
    K.B9 = (t) => {
      st.cam.set({ x: LAUNCH.camera.x, y: 100, zoom: 1, shake: [0, 0] }); bg.cover(st.cam);
      set.update(t);
      // Jade's drummed graphite steps
      [[128, 1], [144, 2], [160, 3]].forEach(([x, n]) => { for (let k = 0; k < n; k++) tiles.draw('fix', x, 60 + k * 16); });
      // Ricky's rising note bends the last stroke up into the ramp
      [[176, 96], [187, 99], [197, 103], [206, 108]].forEach(([x, y], i) => props.draw('note' + (i * 3), x, y));
      // launch: Charlie's trampoline under them, all three airborne together
      C({ x: 232, y: 116, anim: 'jump', frame: 1 });
      J({ x: 266, y: 126, anim: 'drum', frame: 1 });
      R({ x: 302, y: 114, anim: 'jump', frame: 0 });
      for (let k = 0; k < 6; k++) fx.draw('speed' + [14, 10, 6][k % 3], 220 + (k % 3) * 30, 124 + k * 4, { rot: 0.45 });
      sparkle(fx, 0.15, 0, 220, 108, { n: 12, r: 26, color: PAL.yellow });
      [[52, 146], [140, 146]].forEach(([x, y], i) => fx.draw('impact', x, y));
    };
  }

  // ================================================================ B10 · 81.8 THE TURN (overlay on a chroma key, composited in PIL)
  // zoom 0.5 -> 3 output px per world px at 1080p (about the voxel heroes' size); world = (-160 + X/3, -90 + (1080 - Y)/3)
  {
    const id = 'B10';
    const CX = 212, CY = 20;
    const canopy = add(id, spriteQuad('charlie_prop_parachute', 0), Z.ACTOR + 3); canopy.place(CX, CY + 46);
    rope(id, CX - 26, CY + 48, CX - 10, CY + 42, '#5a3a18'); rope(id, CX + 26, CY + 48, CX + 10, CY + 42, '#5a3a18');
    rope(id, CX - 4, CY + 12, CX - 18, CY - 8, '#3a2a10');
    const card = addUI(id, new Banner({ text: 'REALITY LV 2', font: 'px', color: PAL.goldHi, scale: 2 }, { style: 'gold', padX: 10, padY: 7 }), ZUI.BANNER); card.place(160, 150);
    const sub2 = addUI(id, new TextSprite({ text: 'LEVEL LOADED', font: 'skb', color: '#ffffff', outline: PAL.ink }, { anchor: 'c' }), ZUI.BANNER + 1); sub2.place(160, 130);
    K.B10 = (t) => {
      st.cam.set({ x: 160, y: 90, zoom: 0.5, shake: [0, 0] });
      C({ x: CX, y: CY, anim: 'charlie_hang', frame: 0 });
      J({ x: CX + 12, y: CY - 42, anim: 'drum', frame: 1 });
      R({ x: CX - 22, y: CY - 44, anim: 'jump', frame: 1 });
      // touch-down dust on the causeway
      [[176, -26, 2], [188, -24, 3], [204, -27, 3], [222, -25, 3], [238, -24, 2], [250, -22, 2], [170, -18, 2], [246, -14, 2]].forEach(([x, y, s]) => fx.draw('puff5', x, y, { s }));
    };
  }

  // ================================================================ update
  const ACTIVE = { B1: [2, 1], B2: [1], B3: [2, 0], B4: [], B5: [1], B6: [2], B7: [0, 1, 2], B8: [0, 1, 2], B9: [0, 1, 2], B10: [] };
  const BAR = { B5: [0.02], B6: [0.55], B7: [0.75], B8: [0.99, '99%'], B9: [1, '100%'] };
  return {
    stage: st,
    update(t) {
      let cur = KEYS[0][0]; for (const [k, kt] of KEYS) if (t >= kt - 1e-6) cur = k;
      const kt = KEYS.find((k) => k[0] === cur)[1];
      for (const [o, ids] of owned) o.visible = ids.has(cur);
      st.cam.set({ x: 160, y: 90, zoom: 1, shake: [0, 0] });
      if (cur === 'B7') st.cam.set({ x: 176, y: 100, zoom: 0.5 });
      BATCHES.forEach((b) => b.begin());
      [jade, charlie, ricky].forEach((a) => (a.visible = true));
      K[cur](kt);
      bg.cover(st.cam); bg.u.uTime.value = kt; bg.u.uGlitch.value = cur === 'B1' ? 0.06 : 0;
      BATCHES.forEach((b) => b.end());
      // UI
      const key = cur === 'B10';
      st.setBg(key ? KEY_BG : PAL.void); bg.visible = !key;
      hud.visible = jadePortrait.visible = !key;
      hud.set({ singing: { jade: cur === 'B1' }, alert: cur === 'B1', alertOn: true, loc: locAt(kt) });
      jadePortrait.setRect((cur === 'B1' ? 1 : 0) / 2, 0, 1 / 2, 1);
      hl.forEach((q, i) => (q.visible = !key && ACTIVE[cur].includes(i)));
      const b = BAR[cur]; bar.visible = !!b; if (b) bar.set({ pct: b[0], label: b[1] });
      let c = null;
      const LINE = { B1: 10, B2: 11, B3: 11, B4: 12, B5: 13, B7: 16 }[cur];
      if (LINE) c = subtitleFor(kt, LINE, { hold: 0.3 });
      if (cur === 'B8') c = { top: null, bot: 'everything starts from here!' };
      if (cur === 'B9') c = { top: null, bot: 'stroke by stroke!' };
      sub.set(c, { y: cur === 'B5' ? 138 : HUD_H + 3 });
    },
  };
}
