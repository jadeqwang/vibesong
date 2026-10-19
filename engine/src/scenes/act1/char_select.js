// ACT I · 6.755-11.02 · SAVE FILE FOUND · 2011 · CONTINUE?  (v4 Pass B, open_close; approved still #02)
// Replaces the 4 s CHOOSE YOUR PARTY menu (v3; backup engine/out/bak_v4b/open_close/src/scenes/act1/char_select.js).
// The critique's big move 1: the 2011 save file is the story, so the select screen becomes ONE beat at full size:
//   6.755  (beat 4, right after the last chant stab's flash) the save screen slams in: SAVE FILE FOUND / CHARLIE / 2011 /
//          "The Product Manager Song" (v4.3; was "fixtures & functions"); CONTINUE? is selected and blinks; Jade (hair down, graphite pencil in hand) winds up
//   7.183  the 808 hit: Jade presses CONTINUE? with the pencil's pink eraser end: button down + glow + flash + shake
//          (= the approved still, frame for frame)
//   7.611-10.563  (whistle phrase 2) the save year rolls 2011 -> 2026, landing on the bar-7 downbeat with a punch
//   10.563-11.02  hold on 2026; press_start takes over at 11.02 (the breathy 一笔 一画)
// Pixel art drawn in code by assets/v4_stills/tools/passB_oc/build_save02.py (the approved still's own drawing code, split
// into layers): media/act5/tex/save02/*.png + layout.json, 1920x1080 frame px (6 px = one game pixel).
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { TEX, FrameLayer, loadImg, imgTex, loadJSON, FRAME_W, FRAME_H } from '../act5/paperkit.js';

export const SAVE = { press: 7.183, roll: [7.611, 10.563] };

export async function setup(ctx) {
  const P = T.snap(T.cue('act1.bar5_hit')), S0 = ctx.entry.t0, Y0 = T.snap(SAVE.roll[0]), Y1 = T.snap(SAVE.roll[1]);
  const res = new THREE.Vector2(ctx.width, ctx.height), nearest = ctx.height >= 1080;
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(0, FRAME_W, 0, -FRAME_H, -10, 10);
  const root = new THREE.Group(); scene.add(root);
  const lay = await loadJSON(TEX + 'save02/layout.json');
  const L = async (name, z) => { const l = lay[name]; const q = new FrameLayer(imgTex(await loadImg(`${TEX}save02/${name}.png`), { nearest }), l.w, l.h, { res, z }); q.place(l.x, l.y); root.add(q); return q; };
  await L('bg', 0);
  const flames = await Promise.all([0, 1, 2].map((f) => L('flame' + f, 1)));
  const years = {}; for (let y = 2011; y <= 2026; y++) years[y] = await L('year' + y, 2);
  const newgame = await L('newgame', 3);
  const btn = { dim: await L('cont_dim', 4), hi: await L('cont_hi', 4), down: await L('cont_down', 4) };
  const jShadow = await L('jade_shadow', 5), jade = await L('jade', 6);
  void newgame;
  const fx = { flash: 0, fade: 0, flashColor: '#ffffff', fadeColor: '#000000' };
  const yearBox = lay.year2011, yc = [yearBox.x + yearBox.w / 2, yearBox.y + yearBox.h / 2];

  return {
    stage: { kind: '3d', fx },
    update(t) {
      fx.flash = 0;
      // the screen slams in (3 frames) and shakes on the press
      const k = Math.floor((t - T.snap(S0)) * T.fps() + 1e-6), sc = [1.05, 1.02, 1.0][Math.min(2, Math.max(0, k))];
      const sh = t >= P && t < P + 0.15 ? [Math.round(Math.sin(t * 190) * 8 * (1 - (t - P) / 0.15)), Math.round(Math.cos(t * 230) * 6 * (1 - (t - P) / 0.15))] : [0, 0];
      root.scale.setScalar(sc); root.position.set(FRAME_W / 2 * (1 - sc) + sh[0], -FRAME_H / 2 * (1 - sc) - sh[1], 0);
      flames.forEach((q, i) => (q.visible = i === Math.floor(t * 10) % 3));
      // CONTINUE?: selected + blinking before the press, pressed (glow) from the hit on
      const pressed = t >= P;
      const blinkOn = Math.floor((t - S0) / 0.125) % 2 === 0;
      btn.down.visible = pressed; btn.hi.visible = !pressed && blinkOn; btn.dim.visible = !pressed && !blinkOn;
      btn.down.opacity = 1;
      if (T.exactFrame(t, [P])) fx.flash = 0.55;
      // Jade: wound up (pencil drawn back) -> lunges onto the button over the 2 frames before the hit -> holds the press
      const lunge = T.span(t, P - 2 / T.fps(), P, T.ease.out), recoil = 0.35 * T.span(t, P + 0.25, P + 0.5, T.ease.inOut);
      const dx = Math.round((-36 * (1 - lunge) - 12 * recoil) / 6) * 6, dy = Math.round((6 * (1 - lunge)) / 6) * 6;
      jade.place(lay.jade.x + dx, lay.jade.y + dy); jShadow.place(lay.jade_shadow.x + dx, lay.jade_shadow.y + dy);
      // the save year rolls 2011 -> 2026 over whistle phrase 2, lands on the bar-7 downbeat
      const u = T.span(t, Y0, Y1, T.ease.inOut), year = t >= Y1 ? 2026 : 2011 + Math.min(14, Math.floor(15 * u));
      for (const [y, q] of Object.entries(years)) q.visible = +y === year;
      const j = Math.floor((t - Y1) * T.fps() + 1e-6), ps = j >= 0 ? [1.12, 1.06, 1.02, 1.0][Math.min(3, j)] : 1;
      const q = years[year]; q.scale.setScalar(ps); q.position.set(yc[0] - (yearBox.w / 2) * ps, -(yc[1] - (yearBox.h / 2) * ps), 0);
      if (T.exactFrame(t, [Y1])) fx.flash = 0.35;
    },
    render(t, target) {
      const r = ctx.renderer; r.setRenderTarget(target); r.setClearColor(0x0d1232, 1); r.clear(); r.render(scene, cam);
    },
  };
}
